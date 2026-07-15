import { Container } from "@/components/ui/container";

export default function HashtagsLoading() {
  return <main className="hashtags-page"><section className="hashtags-hero"><Container><div className="hashtags-loading-copy" /></Container></section><section className="hashtags-content"><Container><div className="hashtags-loading-grid" aria-busy="true" aria-label="Carregando hashtags">{Array.from({ length: 6 }, (_, index) => <div className="hashtags-loading-card" key={index} />)}</div></Container></section></main>;
}
