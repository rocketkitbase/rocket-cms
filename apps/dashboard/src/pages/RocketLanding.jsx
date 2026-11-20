import { useEffect, useRef } from "react";
import { BarChart3, Blocks, Braces, Building2, CircleCheck, Code2, Gauge, Globe2, Image, KeyRound, Layers3, Maximize, Monitor, Rocket, Search, Sparkles, Target, Users, Zap } from "lucide-react";
import "./rocketLanding.css";

const fundamentals = [
  ["R", "Responsive", "Component-driven content for every screen.", Monitor],
  ["O", "Optimised", "Designed with performance and Core Web Vitals in mind.", Gauge],
  ["C", "Content", "Structured content for your React components.", Layers3],
  ["K", "Key", "Connect your site with a Content Key.", KeyRound],
  ["E", "Enhancement", "Improve your content, media and search visibility.", Sparkles],
  ["T", "Tool", "Keep your existing React workflow.", Code2]
];
const features = [
  ["Headless Content", "Manage pages and structured content.", Blocks],
  ["React SDK", "Connect content to your React components.", Braces],
  ["SEO Intelligence", "Review and edit page metadata.", Search],
  ["AI-Powered Tools", "Draft and refine content in the editor.", Sparkles],
  ["Media Optimisation", "Manage and optimise images for your site.", Image],
  ["Multi-language", "Organise and edit localised content.", Globe2],
  ["Plugins & Extensions", "Extend your workflow with integrations.", Layers3],
  ["Analytics & Insights", "Connect analytics to understand traffic.", BarChart3]
];
const teams = [
  ["Developers", "Integrate content with the components you already ship.", Code2],
  ["Digital Agencies", "Give each client access to their own website.", Rocket],
  ["Businesses & Brands", "Update campaigns and pages from one workspace.", Building2],
  ["Startups & SaaS", "Ship marketing pages, docs and changelogs faster.", Zap],
  ["Enterprises", "Manage multiple websites with scoped access.", Users]
];
const benefits = [
  ["Faster Go-to-Market", "Publish routine updates in the editor.", Zap],
  ["Higher SEO Visibility", "Manage metadata as you update pages.", BarChart3],
  ["Lower Total Cost", "Reduce development time spent on routine edits.", Layers3],
  ["Built to Scale", "Manage content across multiple websites.", Maximize],
  ["Growth Ready", "Bring plugins, analytics and AI into your workflow.", Target]
];
const comparison = [
  ["Architecture", "Headless, API-first", "Often coupled to a theme"],
  ["Developer workflow", "React components and SDK", "Theme and template development"],
  ["Delivery", "Use your existing React hosting", "Hosting depends on the platform"],
  ["SEO", "Metadata and SEO tools in the editor", "Tools vary by platform and plugins"],
  ["Extensions", "APIs and plugin workflows", "Platform-specific plugin ecosystem"],
  ["Multiple websites", "Website-scoped client access", "Depends on the platform or setup"],
  ["AI", "Content tools in the editor", "Depends on the platform or plugins"]
];
const steps = [
  ["Create an account", "Contact Rocket Kit to get access to a workspace.", Users],
  ["Install the SDK", "Add the Rocket Kit SDK to your React project.", Code2],
  ["Connect & configure", "Use your Content Key to connect your website.", Layers3],
  ["Manage & launch", "Edit, preview and publish your content.", Rocket]
];
const faq = [
  ["What is Rocket Kit CMS?", "Rocket Kit is a headless content editor and publishing toolkit for React websites."],
  ["Is it a CMS or a developer tool?", "It combines a content dashboard for editors with an SDK and APIs for developers."],
  ["Which React frameworks are supported?", "The SDK is designed for React projects, including Next.js, Vite and Remix. Setup depends on how your site renders and deploys."],
  ["Do I need to rebuild my website?", "You can connect an existing site. Source or SDK integration may be required to make specific content editable."],
  ["Can I manage multiple websites?", "Yes. An administrator can manage connected websites and assign access to client accounts."],
  ["Is it good for SEO?", "Rocket gives editors tools to manage metadata. Search rankings also depend on the site and its content."],
  ["Does it support multiple languages?", "Rocket supports organising and editing localised content. Your site controls how those locales are presented."],
  ["Is there a free plan or trial?", "Contact the Rocket Kit team for current access and pricing options."]
];
const mail = (subject) => `mailto:admin@rocketkit.in?subject=${encodeURIComponent(subject)}`;

function DashboardPreview() {
  return (
    <div className="rk-dashboard" aria-label="Illustrative Rocket Kit dashboard">
      <aside><img src="/logo.png" alt="" />{["Dashboard", "Pages", "Blog", "Media", "Forms", "SEO", "Analytics", "Plugins"].map((item) => <span key={item}>{item}</span>)}</aside>
      <div className="rk-dashboard-body">
        <header><strong>Dashboard</strong><small>Sample workspace</small></header>
        <div className="rk-metrics">{[["Pages", "128"], ["Blog posts", "64"], ["Media files", "256"], ["Submissions", "532"]].map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}</div>
        <div className="rk-dashboard-panels">
          <div><small>SEO overview</small><div className="rk-score">92<small>/100</small></div></div>
          <div><small>Traffic overview</small><div className="rk-chart" aria-hidden="true">{[24, 41, 34, 56, 47, 73, 62, 91].map(height => <i key={height} style={{ height: `${height}%` }} />)}</div></div>
          <div><small>Top pages</small>{["Home", "Features", "Blog", "Docs"].map(name => <span key={name}>{name}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

export default function RocketLanding() {
  const page = useRef(null);
  useEffect(() => {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.classList.add("rk-in-view");
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.12 });
    page.current?.querySelectorAll("[data-reveal]").forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={page} className="rk-landing" id="top">
      <header className="rk-nav rk-shell">
        <a href="#top" aria-label="Rocket Kit homepage"><img src="/logo.png" alt="Rocket Kit CMS" /></a>
        <nav aria-label="Main navigation"><a href="#product">Product</a><a href="#features">Features</a><a href="#solutions">Solutions</a><a href="#faq">Resources</a><a href="#pricing">Pricing</a></nav>
        <div className="rk-actions"><a className="rk-button rk-outline" href={mail("Rocket Kit demo")}>Book a Demo</a><a className="rk-button" href="#start">Get Started</a></div>
      </header>

      <main>
        <section className="rk-hero" id="product">
          <div className="rk-hero-art" aria-hidden="true" />
          <div className="rk-shell rk-hero-inner">
            <div className="rk-hero-copy">
              <div className="rk-launch">Launch day <strong>14 August 2026</strong></div>
              <p className="rk-eyebrow">Rainhopes Foundation Day</p>
              <img className="rk-hero-logo" src="/logo.png" alt="Rocket Kit CMS" />
              <h1>Content Infrastructure<br />for <em>React</em></h1>
              <p>A headless CMS for developers and content teams. Build, manage and scale React websites with tools for publishing, SEO and AI-assisted editing.</p>
              <div className="rk-actions"><a className="rk-button" href="#start">Get Started</a><a className="rk-button rk-outline" href="#demo">View Demo</a></div>
              <ul className="rk-checks">{["Lightweight SDK", "Developer friendly", "Performance first"].map(label => <li key={label}><CircleCheck size={16} />{label}</li>)}</ul>
            </div>
            <div className="rk-hero-preview" id="demo" tabIndex={-1}><DashboardPreview /></div>
          </div>
        </section>

        <div className="rk-shell rk-sections">
          <section className="rk-split" data-reveal>
            <div><h2>The Fundamentals<br />of <em>Rocket</em></h2><p>Six principles for connecting content to React.</p></div>
            <div className="rk-fundamentals">{fundamentals.map(([letter, title, copy, Icon]) => <article key={letter}><Icon size={27} /><strong>{letter}</strong><h3>{title}</h3><p>{copy}</p></article>)}</div>
          </section>
          <section className="rk-split" id="features" data-reveal>
            <div><h2>Powerful Features<br />for <em>Modern React Apps</em></h2><p>Manage, optimise and publish content from one workspace.</p></div>
            <div className="rk-features">{features.map(([title, copy, Icon]) => <article key={title}><div className="rk-icon"><Icon size={22} /></div><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
          </section>
          <section className="rk-split rk-team-section" id="solutions" data-reveal>
            <div><h2>Built for Teams<br />Who Build with <em>React</em></h2><p>For developers, agencies and businesses managing React websites.</p></div>
            <div className="rk-teams">{teams.map(([title, copy, Icon]) => <article key={title}><div className="rk-team-art"><Icon size={36} /></div><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
          </section>
          <section className="rk-split" data-reveal>
            <div><h2>How Your Business<br />Benefits with <em>Rocket</em></h2><p>Help your team spend less time on routine publishing work.</p></div>
            <div className="rk-benefits">{benefits.map(([title, copy, Icon]) => <article key={title}><Icon size={27} /><h3>{title}</h3><p>{copy}</p></article>)}</div>
          </section>
          <section className="rk-split rk-compare" data-reveal>
            <div><h2><em>Rocket</em> vs<br />Traditional CMS</h2><p>Compare Rocket’s approach with a theme-based CMS.</p></div>
            <div className="rk-table-wrap" tabIndex={0} role="region" aria-label="CMS comparison">
              <table><thead><tr><th>Capability</th><th>Rocket Kit CMS</th><th>Traditional CMS</th></tr></thead>
                <tbody>{comparison.map(([name, rocket, traditional]) => <tr key={name}><th scope="row">{name}</th><td>{rocket}</td><td>{traditional}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
          <section className="rk-split" id="start" data-reveal>
            <div><h2>How to Get Started<br />with <em>Rocket</em></h2><a className="rk-text-link" href={mail("Rocket Kit access")}>Request access</a></div>
            <ol className="rk-steps">{steps.map(([title, copy, Icon]) => <li key={title}><Icon size={24} /><h3>{title}</h3><p>{copy}</p></li>)}</ol>
          </section>
          <section className="rk-split rk-faq-section" id="faq" data-reveal>
            <div><h2>Frequently Asked<br /><em>Questions</em></h2></div>
            <div className="rk-faq">{faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
          </section>
          <section className="rk-final" id="pricing" data-reveal>
            <Rocket size={42} aria-hidden="true" />
            <div><h2>Experience <em>Rocket Kit CMS</em></h2><p>Talk to us about access, pricing or a walkthrough.</p></div>
            <div className="rk-actions"><a className="rk-button" href={mail("Rocket Kit access and pricing")}>Request Access</a><a className="rk-button rk-outline" href={mail("Rocket Kit demo")}>Book a Demo</a></div>
          </section>
        </div>
      </main>
      <footer className="rk-footer">
        <div className="rk-shell">
          <div className="rk-footer-grid">
            <div><img src="/logo.png" alt="Rocket Kit CMS" /><p>Content Infrastructure for React</p></div>
            <div><h3>Product</h3><a href="#product">Overview</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div>
            <div><h3>Solutions</h3><a href="#solutions">Developers &amp; Agencies</a><a href="#solutions">Businesses &amp; Enterprises</a></div>
            <div><h3>Resources</h3><a href="#start">Getting Started</a><a href="#faq">FAQ</a></div>
            <div><h3>Company</h3><a href={mail("Rocket Kit enquiry")}>Contact</a><small>A product by</small><strong className="rk-rainhopes">Rainhopes</strong></div>
          </div>
          <div className="rk-footer-bottom"><span>© {new Date().getFullYear()} Rocket Kit CMS</span><a href="/admiral">Admin sign-in</a></div>
        </div>
      </footer>
    </div>
  );
}
