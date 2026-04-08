import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Construction, ChevronRight, ChevronLeft, Server, Shield, Network, Rocket, Database, CheckCircle2, Copy, ExternalLink, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

import stepInstallImg from '@/assets/setup-step1-install.jpg';
import stepHttpsImg from '@/assets/setup-step2-https.jpg';
import stepNetworkImg from '@/assets/setup-step3-network.jpg';
import stepBuildImg from '@/assets/setup-step4-build.jpg';
import stepBackupImg from '@/assets/setup-step5-backup.jpg';

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast({ title: 'Copied!', description: 'Command copied to clipboard.' });
};

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock = ({ code }: CodeBlockProps) => (
  <div className="relative group">
    <pre className="bg-muted/80 rounded-lg p-4 text-sm font-mono overflow-x-auto border">
      <code>{code}</code>
    </pre>
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
      onClick={() => copyToClipboard(code)}
    >
      <Copy size={14} />
    </Button>
  </div>
);

const steps = [
  {
    id: 1,
    title: 'Install Prerequisites',
    subtitle: 'Set up Node.js on your server',
    icon: Server,
    image: stepInstallImg,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Install Node.js 18+ on the machine that will act as your office server.</p>
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Windows</h4>
          <p className="text-sm text-muted-foreground">Download from <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">nodejs.org <ExternalLink size={12} /></a> and run the installer.</p>

          <h4 className="font-semibold text-sm">macOS</h4>
          <CodeBlock code="brew install node" />

          <h4 className="font-semibold text-sm">Linux (Ubuntu/Debian)</h4>
          <CodeBlock code={`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt-get install -y nodejs`} />
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm"><strong>Verify:</strong> Run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">node --version</code> — you should see v18+ or v20+.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Clone & Install the project</h4>
          <CodeBlock code={`git clone <YOUR_GIT_URL>\ncd <YOUR_PROJECT_NAME>\nnpm install`} />
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Set Up HTTPS (mkcert)',
    subtitle: 'Secure cookies and login sessions',
    icon: Shield,
    image: stepHttpsImg,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">HTTPS ensures login cookies are secure and prevents session hijacking on your LAN. We use <strong>mkcert</strong> to create locally-trusted certificates.</p>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Step 2a — Install mkcert</h4>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Windows (using Chocolatey):</p>
            <CodeBlock code="choco install mkcert" />
            <p className="text-xs text-muted-foreground font-medium">macOS:</p>
            <CodeBlock code="brew install mkcert" />
            <p className="text-xs text-muted-foreground font-medium">Linux:</p>
            <CodeBlock code={`sudo apt install libnss3-tools\ncurl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"\nchmod +x mkcert-v*-linux-amd64\nsudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert`} />
          </div>

          <h4 className="font-semibold text-sm">Step 2b — Install the local CA</h4>
          <CodeBlock code="mkcert -install" />
          <p className="text-sm text-muted-foreground">This adds a local Certificate Authority to your system trust store. Run it once.</p>

          <h4 className="font-semibold text-sm">Step 2c — Generate certificates</h4>
          <CodeBlock code={`mkdir certs\nmkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 192.168.1.100`} />
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-sm">⚠️ Replace <code className="bg-muted px-1.5 py-0.5 rounded text-xs">192.168.1.100</code> with your server's actual LAN IP address.</p>
          </div>

          <h4 className="font-semibold text-sm">Step 2d — Trust on team machines</h4>
          <p className="text-sm text-muted-foreground">Copy the CA certificate from the server to each team machine:</p>
          <CodeBlock code={`# Find the CA cert location:\nmkcert -CAROOT\n# Copy rootCA.pem to team machines and install it`} />
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Build & Start the Server',
    subtitle: 'Create the production bundle and launch',
    icon: Rocket,
    image: stepBuildImg,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Build the app for production and start the server.</p>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Build the production bundle</h4>
          <CodeBlock code="npm run build" />
          <p className="text-sm text-muted-foreground">This creates a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">dist/</code> folder with optimized files.</p>

          <h4 className="font-semibold text-sm">Start the server</h4>
          <CodeBlock code="node serve.cjs" />

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold">You'll see output like:</p>
            <pre className="text-xs font-mono bg-muted rounded p-3">
{`🔒 BuildForge running with HTTPS:

  Local:   https://localhost:8443
  Network: https://192.168.1.100:8443

  HTTP redirect: http://192.168.1.100:8080 → https://...`}
            </pre>
          </div>

          <h4 className="font-semibold text-sm">Run in background (production)</h4>
          <CodeBlock code={`npm install -g pm2\npm2 start serve.cjs --name buildforge\npm2 save\npm2 startup   # Auto-start on boot`} />
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Network & Firewall Setup',
    subtitle: 'Allow team access on your LAN',
    icon: Network,
    image: stepNetworkImg,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Configure your server machine's network to allow team access.</p>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">1. Set a static IP</h4>
          <p className="text-sm text-muted-foreground">Assign a static LAN IP so the URL doesn't change after reboot.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-semibold mb-1">Windows</p>
              <p className="text-xs text-muted-foreground">Control Panel → Network → Adapter → IPv4 Properties → Manual IP</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-semibold mb-1">Linux</p>
              <p className="text-xs text-muted-foreground">Edit <code>/etc/netplan/*.yaml</code> or use NetworkManager</p>
            </div>
          </div>

          <h4 className="font-semibold text-sm">2. Open firewall ports</h4>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Windows:</p>
            <CodeBlock code={`netsh advfirewall firewall add rule name="BuildForge HTTPS" dir=in action=allow protocol=tcp localport=8443\nnetsh advfirewall firewall add rule name="BuildForge HTTP" dir=in action=allow protocol=tcp localport=8080`} />
            <p className="text-xs text-muted-foreground font-medium">Linux:</p>
            <CodeBlock code={`sudo ufw allow 8443/tcp\nsudo ufw allow 8080/tcp`} />
          </div>

          <h4 className="font-semibold text-sm">3. Share with your team</h4>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-sm">Share <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold">https://192.168.1.100:8443</code> with your team. They open it in any browser — no installation needed.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Port</th>
                <th className="px-4 py-2 text-left font-medium">Protocol</th>
                <th className="px-4 py-2 text-left font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t"><td className="px-4 py-2">8443</td><td className="px-4 py-2">HTTPS</td><td className="px-4 py-2">App (secure)</td></tr>
              <tr className="border-t"><td className="px-4 py-2">8080</td><td className="px-4 py-2">HTTP</td><td className="px-4 py-2">Redirects to HTTPS</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: 'Backup & Maintenance',
    subtitle: 'Protect your data and keep running smoothly',
    icon: Database,
    image: stepBackupImg,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">Your data lives in the cloud backend, but it's good practice to set up local backups and regular maintenance.</p>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Automatic data backup</h4>
          <p className="text-sm text-muted-foreground">Use the built-in Export feature (Settings → Backup) to download project data as JSON/Excel regularly.</p>

          <h4 className="font-semibold text-sm">Update the app</h4>
          <CodeBlock code={`cd /path/to/buildforge\ngit pull\nnpm install\nnpm run build\npm2 restart buildforge`} />

          <h4 className="font-semibold text-sm">Monitor the server</h4>
          <CodeBlock code={`pm2 status          # Check if running\npm2 logs buildforge  # View recent logs\npm2 monit           # Live resource monitor`} />

          <h4 className="font-semibold text-sm">Renew mkcert certificates</h4>
          <p className="text-sm text-muted-foreground">mkcert certificates don't expire for ~10 years, so no renewal needed in practice. If you change the server IP, regenerate:</p>
          <CodeBlock code="mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost NEW_IP" />
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">📋 Maintenance Checklist</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Weekly: Export data backup</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Monthly: Update app & dependencies</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Quarterly: Review audit logs & user access</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Ensure server has internet (for cloud backend)</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export default function SetupGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  const handlePrintPDF = () => {
    const pw = window.open('', '_blank');
    if (!pw) return;

    const stepsContent = steps.map((s, i) => `
      <div class="step" style="${i > 0 ? 'page-break-before:always;' : ''}">
        <div class="step-header">
          <span class="step-badge">Step ${s.id}</span>
          <h2>${s.title}</h2>
          <p class="subtitle">${s.subtitle}</p>
        </div>
      </div>
    `).join('');

    const commandBlocks: Record<number, string[]> = {
      1: [
        'brew install node',
        'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt-get install -y nodejs',
        'node --version',
        'git clone <YOUR_GIT_URL>\ncd <YOUR_PROJECT_NAME>\nnpm install'
      ],
      2: [
        'choco install mkcert',
        'brew install mkcert',
        'sudo apt install libnss3-tools\ncurl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"\nchmod +x mkcert-v*-linux-amd64\nsudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert',
        'mkcert -install',
        'mkdir certs\nmkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 192.168.1.100',
        'mkcert -CAROOT'
      ],
      3: [
        'npm run build',
        'node serve.cjs',
        'npm install -g pm2\npm2 start serve.cjs --name buildforge\npm2 save\npm2 startup'
      ],
      4: [
        'netsh advfirewall firewall add rule name="BuildForge HTTPS" dir=in action=allow protocol=tcp localport=8443\nnetsh advfirewall firewall add rule name="BuildForge HTTP" dir=in action=allow protocol=tcp localport=8080',
        'sudo ufw allow 8443/tcp\nsudo ufw allow 8080/tcp'
      ],
      5: [
        'cd /path/to/buildforge\ngit pull\nnpm install\nnpm run build\npm2 restart buildforge',
        'pm2 status\npm2 logs buildforge\npm2 monit',
        'mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost NEW_IP'
      ]
    };

    const detailedSteps = steps.map((s, i) => {
      const cmds = commandBlocks[s.id] || [];
      const cmdHtml = cmds.map(c => `<pre class="code">${c}</pre>`).join('');
      return `
        <div class="step" style="${i > 0 ? 'page-break-before:always;' : ''}">
          <div class="step-header">
            <span class="step-badge">Step ${s.id}</span>
            <h2>${s.title}</h2>
            <p class="subtitle">${s.subtitle}</p>
          </div>
          <div class="step-body">
            ${s.id === 1 ? '<p>Install Node.js 18+ on the server machine. Download from nodejs.org (Windows), or use the commands below.</p>' : ''}
            ${s.id === 2 ? '<p>HTTPS secures login cookies. Install mkcert, set up the local CA, and generate certificates for your LAN IP.</p>' : ''}
            ${s.id === 3 ? '<p>Build for production, then start the server. Use PM2 for auto-restart on boot.</p>' : ''}
            ${s.id === 4 ? '<p>Set a static LAN IP and open firewall ports so your team can access the app.</p>' : ''}
            ${s.id === 5 ? '<p>Regular backups, updates, and server monitoring keep things running smoothly.</p>' : ''}
            ${cmdHtml}
            ${s.id === 4 ? '<table><thead><tr><th>Port</th><th>Protocol</th><th>Purpose</th></tr></thead><tbody><tr><td>8443</td><td>HTTPS</td><td>App (secure)</td></tr><tr><td>8080</td><td>HTTP</td><td>Redirects to HTTPS</td></tr></tbody></table>' : ''}
            ${s.id === 5 ? '<h3>Maintenance Checklist</h3><ul><li>Weekly: Export data backup</li><li>Monthly: Update app &amp; dependencies</li><li>Quarterly: Review audit logs &amp; user access</li><li>Ensure server has internet (for cloud backend)</li></ul>' : ''}
          </div>
        </div>`;
    }).join('');

    pw.document.write(`<!DOCTYPE html><html><head><title>BuildForge Setup Guide</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#1a1a2e;padding:15mm 20mm;font-size:10pt;line-height:1.6}
  h1{font-size:22pt;font-weight:900;text-align:center;margin-bottom:4px}
  .header-sub{text-align:center;font-size:9pt;color:#666;margin-bottom:20px}
  .step{margin-bottom:20px}
  .step-header{margin-bottom:12px;border-bottom:2px solid #1a1a2e;padding-bottom:8px}
  .step-badge{display:inline-block;background:#1a1a2e;color:#fff;font-size:8pt;font-weight:700;padding:3px 10px;border-radius:12px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
  h2{font-size:14pt;font-weight:800;margin-top:4px}
  .subtitle{font-size:9pt;color:#666;margin-top:2px}
  .step-body{padding:0 4px}
  .step-body p{margin-bottom:10px;color:#444}
  .step-body h3{font-size:11pt;font-weight:700;margin:14px 0 6px}
  pre.code{background:#f4f4f5;border:1px solid #e4e4e7;border-radius:6px;padding:10px 14px;font-family:'Consolas','Monaco',monospace;font-size:8.5pt;margin:8px 0;white-space:pre-wrap;word-break:break-all}
  table{width:100%;border-collapse:collapse;margin:10px 0}
  th{background:#1a1a2e;color:#fff;font-size:8pt;font-weight:700;padding:6px 10px;text-align:left}
  td{padding:5px 10px;font-size:9pt;border-bottom:1px solid #e4e4e7}
  ul{margin:8px 0;padding-left:20px}
  li{margin:4px 0;font-size:9pt}
  .footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:7.5pt;color:#888;text-align:center}
  @media print{body{padding:10mm 15mm}@page{size:A4;margin:10mm}}
</style></head><body>
  <h1>🏗️ BuildForge Setup Guide</h1>
  <div class="header-sub">Self-Hosted LAN Server · Step-by-Step Instructions · ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
  ${detailedSteps}
  <div class="footer">BuildForge Engineering · Self-Hosting Setup Guide · Generated ${new Date().toLocaleString('en-GB')}</div>
</body></html>`);
    pw.document.close();
    setTimeout(() => pw.print(), 300);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Construction size={20} className="text-primary-foreground" />
            </div>
             <div>
              <h1 className="text-lg font-bold text-foreground">BuildForge Setup Guide</h1>
              <p className="text-xs text-muted-foreground">Self-hosted LAN server setup</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintPDF} className="gap-1.5">
              <FileDown size={14} /> Export PDF
            </Button>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Skip to Login →
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step navigation pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
                i === currentStep
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : i < currentStep
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              {i < currentStep ? (
                <CheckCircle2 size={16} />
              ) : (
                <s.icon size={16} />
              )}
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{s.id}</span>
            </button>
          ))}
        </div>

        {/* Current step content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Image + info */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="overflow-hidden">
              <img
                src={step.image}
                alt={step.title}
                className="w-full h-48 object-cover"
                loading="lazy"
                width={800}
                height={512}
              />
              <CardContent className="p-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${step.bgColor} mb-3`}>
                  <step.icon size={14} className={step.color} />
                  <span className={`text-xs font-semibold ${step.color}`}>Step {step.id}</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{step.subtitle}</p>
              </CardContent>
            </Card>

            {/* Quick requirements */}
            {currentStep === 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                    <span>Node.js 18+</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                    <span>Internet on server</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                    <span>Static LAN IP</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                    <span>Git (for updates)</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Detailed instructions */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {step.content}
            </CardContent>
          </Card>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft size={16} /> Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="gap-2"
            >
              Next Step <ChevronRight size={16} />
            </Button>
          ) : (
            <Link to="/login">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 size={16} /> Go to Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
