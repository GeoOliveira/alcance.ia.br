import { Container } from "@/components/ui/container";

export default function TrendingReelsLoading() {
  return <main className="reels-trending-page"><section className="reels-trending-hero"><Container><div className="reels-trending-loading-copy" aria-label="Carregando amostra pública" /></Container></section><section className="reels-trending-content"><Container><div className="reels-trending-loading-grid" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div className="reels-trending-loading-card" key={index} />)}</div></Container></section></main>;
}
