import Link from "next/link";

export function MemberUnavailable() {
  return <div className="member-card member-unavailable"><h1>Şu anda işlem yapılamıyor</h1><p>Üyelik hizmeti geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.</p><Link className="member-button" href="/passenger">Turlara dön</Link></div>;
}
