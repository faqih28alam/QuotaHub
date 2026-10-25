import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, providerId, apiKey, endpoint, alertThreshold = 2.0, maxQuota = 20.0 } = body;

    // Simulate demo keys or offline testing smoothly
    if (id?.startsWith('demo-') || apiKey?.includes('xxxx') || apiKey?.includes('•••')) {
      await new Promise(r => setTimeout(r, 600));
      const currentBalance = body.balance ?? 10.0;
      const jitter = (Math.random() * 0.2 - 0.1);
      const newBalance = Math.max(0.05, +(currentBalance + jitter).toFixed(2));
      const status = newBalance <= 0.2 ? 'danger' : newBalance <= alertThreshold ? 'warning' : 'healthy';
      const used = Math.max(0, +(maxQuota - newBalance).toFixed(2));

      return NextResponse.json({
        success: true,
        isSimulated: true,
        balance: newBalance,
        used,
        maxQuota,
        status,
        lastChecked: new Date().toISOString(),
        message: 'Checked via simulated health provider'
      });
    }

    // 1. 2Captcha Real Server Fetch
    if (providerId === 'twocaptcha') {
      const url = `https://2captcha.com/res.php?key=${encodeURIComponent(apiKey)}&action=getbalance&json=1`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();

      if (data.status === 1) {
        const balance = parseFloat(data.request);
        const status = balance <= 0.2 ? 'danger' : balance <= alertThreshold ? 'warning' : 'healthy';
        return NextResponse.json({
          success: true,
          balance,
          maxQuota: Math.max(10, balance * 1.25),
          status,
          lastChecked: new Date().toISOString()
        });
      }
      return NextResponse.json({
        success: false,
        error: data.request || 'Invalid 2Captcha API response'
      }, { status: 400 });
    }

    // 2. TikHub Real Server Fetch
    if (providerId === 'tikhub') {
      const res = await fetch('https://api.tikhub.io/user/profile', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `TikHub returned HTTP ${res.status}`
        }, { status: res.status });
      }

      const data = await res.json();
      const balance = data?.data?.balance ?? 10.0;
      const status = balance <= 0.2 ? 'danger' : balance <= alertThreshold ? 'warning' : 'healthy';

      return NextResponse.json({
        success: true,
        balance: parseFloat(balance),
        maxQuota: 20.0,
        status,
        lastChecked: new Date().toISOString()
      });
    }

    // 3. OpenAI Real Server Fetch (Key validation via models API)
    if (providerId === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `OpenAI authentication failed: HTTP ${res.status}`
        }, { status: res.status });
      }

      // Key is valid! Return estimated/retained balance
      const balance = body.balance ?? 15.0;
      return NextResponse.json({
        success: true,
        balance,
        maxQuota,
        status: balance <= alertThreshold ? 'warning' : 'healthy',
        lastChecked: new Date().toISOString(),
        message: 'OpenAI key verified active'
      });
    }

    // 4. Custom Endpoint
    if (providerId === 'custom' && endpoint) {
      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `Custom endpoint error: ${res.status}`
        }, { status: res.status });
      }

      const data = await res.json();
      const balance = parseFloat(data.balance ?? data.credits ?? data.remaining ?? 50);
      return NextResponse.json({
        success: true,
        balance,
        maxQuota: maxQuota || 100,
        status: balance <= alertThreshold ? 'warning' : 'healthy',
        lastChecked: new Date().toISOString()
      });
    }

    // Default Fallback
    const curBalance = body.balance ?? 20.0;
    return NextResponse.json({
      success: true,
      balance: curBalance,
      maxQuota,
      status: curBalance <= alertThreshold ? 'warning' : 'healthy',
      lastChecked: new Date().toISOString()
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown internal error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
