"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const INITIAL_FOLLOWERS = 12_721;
const FINAL_FOLLOWERS = 12_847;

export function HeroProfileVisual() {
  const root = useRef<HTMLDivElement>(null);
  const [followers, setFollowers] = useState(INITIAL_FOLLOWERS);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.45 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedMotionTimer = window.setTimeout(() => setFollowers(FINAL_FOLLOWERS), 0);
      return () => window.clearTimeout(reducedMotionTimer);
    }
    const timer = window.setInterval(() => {
      setFollowers((current) => {
        if (current >= FINAL_FOLLOWERS) {
          window.clearInterval(timer);
          return FINAL_FOLLOWERS;
        }
        return Math.min(current + 7, FINAL_FOLLOWERS);
      });
    }, 170);
    return () => window.clearInterval(timer);
  }, [started]);

  return <div ref={root} className="hero-visual hero-profile-demo" aria-label="Demonstração ilustrativa de um perfil organizado para análise">
    <div className="visual-glow" />
    <div className="hero-profile-card">
      <div className="hero-profile-topline"><span>VISÃO DO PERFIL</span><small>Demonstração ilustrativa</small></div>
      <div className="hero-profile-head">
        <div className="hero-avatar"><Image src="/images/home/creator-avatar-v1.png" alt="Retrato ilustrativo de uma criadora de conteúdo fictícia" width={72} height={72} priority /></div>
        <div className="hero-profile-identity"><div><strong>marina.cria</strong><i aria-label="Perfil verificado">✓</i></div><span>Marina · estratégia de conteúdo</span><small>Ideias práticas para marcas que querem comunicar melhor.</small></div>
        <button type="button" tabIndex={-1} aria-hidden="true">•••</button>
      </div>
      <dl className="hero-profile-stats">
        <div><dt>publicações</dt><dd>186</dd></div>
        <div className="hero-followers-stat"><dt>seguidores</dt><dd>{followers.toLocaleString("pt-BR")}</dd><span key={followers}>+7</span></div>
        <div><dt>seguindo</dt><dd>428</dd></div>
      </dl>
      <div className="hero-post-tabs" aria-hidden="true"><span className="is-active">▦</span><span>▤</span><span>◎</span></div>
      <div className="hero-post-grid" aria-label="Exemplos ilustrativos de publicações">
        <div className="hero-post-photo"><Image src="/images/home/creator-avatar-v1.png" alt="Publicação ilustrativa com a criadora fictícia" width={150} height={150} /></div>
        <div className="hero-post-card hero-post-card-coral"><small>3 passos</small><strong>Conteúdo que conecta</strong><span>→</span></div>
        <div className="hero-post-card hero-post-card-green"><small>novo guia</small><strong>Menos ruído. Mais direção.</strong><span>✦</span></div>
      </div>
      <div className="hero-analysis-signal"><div><span>Consistência do perfil</span><strong>84%</strong></div><i><b /></i><small>Sinal positivo · frequência e identidade visual alinhadas</small></div>
    </div>
    <div className="insight-float hero-insight-float"><span>✦</span><div><strong>Oportunidade identificada</strong><small>Transforme sinais em decisões</small></div></div>
    <div className="hero-growth-pill"><i>↗</i><span><strong>+126</strong><small>novos seguidores</small></span></div>
    <div className="orb orb-one" /><div className="orb orb-two" />
  </div>;
}
