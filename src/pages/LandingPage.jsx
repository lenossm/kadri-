import { useEffect, useRef } from 'react';
import { ArrowRight, CircleDot, Command, MoveUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

const modules = ['Inquiries', 'Pipeline', 'Reviews', 'Ideas', 'Payments', 'Publishing'];

export default function LandingPage() {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.landing-nav > *', { y: -16, opacity: 0, duration: .7, stagger: .05, ease: 'power3.out' });
      gsap.from('.hero-kicker, .hero-title .line, .hero-copy, .hero-actions', { y: 34, opacity: 0, duration: .9, stagger: .08, delay: .1, ease: 'power4.out' });
      gsap.from('.hero-orbit', { scale: .8, opacity: 0, duration: 1.4, delay: .35, ease: 'power3.out' });
    }, root);
    return () => ctx.revert();
  }, []);

  return <div className="landing" ref={root}>
    <div className="landing-grain" />
    <nav className="landing-nav">
      <a className="landing-brand" href="#top"><span>K</span>KADRI</a>
      <div className="landing-links"><a href="#engine">Engine</a><a href="#systems">Systems</a><a href="#review">Review</a></div>
      <Link to="/app/dashboard" className="nav-enter">Enter workspace <ArrowRight size={16}/></Link>
    </nav>

    <section className="landing-hero" id="top">
      <video className="hero-film" muted autoPlay loop playsInline poster="/media/kadri-review-poster.jpg">
        <source media="(min-width: 2560px)" src="/media/master/kadri-review-4k.mp4" type="video/mp4" />
        <source src="/media/kadri-review.mp4" type="video/mp4" />
      </video>
      <div className="hero-film-overlay" />
      <div className="hero-content">
        <span className="hero-kicker">TBILISI / CREATIVE PRODUCTION OPERATING SYSTEM</span>
        <h1 className="hero-title"><span className="line">KADRI</span><span className="line hero-title__serif">holds the work</span><span className="line">behind the frame.</span></h1>
        <p className="hero-copy">Inquiry to brief. Shoot to review. Approval to archive. One living workspace for the production work nobody sees.</p>
        <div className="hero-actions"><Link className="primary-cta" to="/app/dashboard">Enter demo workspace <MoveUpRight size={17}/></Link><a className="text-cta" href="#engine">See the system ↓</a></div>
      </div>
      <div className="hero-orbit" aria-hidden="true">
        <div className="orbit orbit--one"/><div className="orbit orbit--two"/><div className="orbit orbit--three"/>
        <div className="orbit-core"><span>LIVE</span><strong>06</strong><small>projects in motion</small></div>
        {modules.map((m, i) => <span className={`orbit-label orbit-label--${i+1}`} key={m}>{m}</span>)}
      </div>
      <div className="hero-footer"><span>© 2026 KADRI</span><span>SCROLL TO TRACE THE WORKFLOW</span></div>
    </section>

    <section className="landing-section engine" id="engine">
      <div className="section-intro"><span className="eyebrow">01 / THE ENGINE</span><h2>Every project has a pulse.</h2><p>KADRI keeps the practical mess visible without turning creative work into spreadsheet theatre.</p></div>
      <div className="engine-frame">
        <div className="engine-top"><span>PRODUCTION ENGINE / LIVE</span><span className="live-dot"><i/> all systems nominal</span></div>
        <div className="engine-grid">
          <div className="engine-stat"><span>INCOMING</span><strong>03</strong><small>new briefs waiting</small></div>
          <div className="engine-stat engine-stat--hero"><span>IN MOTION</span><strong>06</strong><small>active productions</small><div className="sparkline"><i/><i/><i/><i/><i/><i/><i/></div></div>
          <div className="engine-stat"><span>REVIEW</span><strong>02</strong><small>versions with clients</small></div>
          <div className="engine-timeline">
            {['BRIEF','PRE-PRO','SHOOT','POST','REVIEW','DELIVER'].map((x,i)=><div className={i<4?'done':''} key={x}><span>{String(i+1).padStart(2,'0')}</span><b>{x}</b></div>)}
          </div>
        </div>
      </div>
    </section>

    <section className="landing-section systems" id="systems">
      <div className="section-intro section-intro--center"><span className="eyebrow">02 / SYSTEMS ATLAS</span><h2>One orbit. Different jobs.</h2></div>
      <div className="systems-orbit">
        <div className="systems-core"><CircleDot/><span>KADRI</span><small>production OS</small></div>
        {modules.map((m,i)=><Link to={mapModule(m)} className={`system-node system-node--${i+1}`} key={m}><span>{String(i+1).padStart(2,'0')}</span><strong>{m}</strong><MoveUpRight size={15}/></Link>)}
        <div className="systems-ring systems-ring--1"/><div className="systems-ring systems-ring--2"/><div className="systems-ring systems-ring--3"/>
      </div>
    </section>

    <section className="landing-section review-showcase" id="review">
      <div className="review-showcase__copy"><span className="eyebrow">03 / SCREENING ROOM</span><h2>Feedback belongs on the frame where it happened.</h2><p>Review versions, pin comments to time, seek straight back to the moment and move a cut from changes to approved without leaving the workspace.</p><Link to="/app/reviews/review-1" className="primary-cta primary-cta--light">Open screening room <ArrowRight size={17}/></Link></div>
      <div className="review-monitor"><div className="monitor-head"><span>ROOM TONE / V4</span><span>00:18.5</span></div><video muted autoPlay loop playsInline src="/media/kadri-review.mp4" poster="/media/kadri-review-poster.jpg"/><div className="monitor-comment"><span>00:18</span><p>“I would keep the silence here.”</p></div></div>
    </section>

    <section className="landing-final">
      <span className="eyebrow">KADRI / კადრი</span>
      <h2>Ideas arrive messy.<br/><em>The system shouldn't.</em></h2>
      <Link to="/app/dashboard" className="giant-enter"><span>ENTER WORKSPACE</span><Command size={34}/></Link>
      <footer><span>Tbilisi, Georgia</span><span>Independent portfolio concept</span><span>2026</span></footer>
    </section>
  </div>;
}

function mapModule(name) {
  return ({ Inquiries:'/app/inquiries', Pipeline:'/app/pipeline', Reviews:'/app/reviews', Ideas:'/app/ideas', Payments:'/app/payments', Publishing:'/app/publishing' })[name];
}
