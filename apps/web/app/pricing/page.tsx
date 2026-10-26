import { Header, Footer } from "../../components/header";
import { plans } from "../../../../packages/shared/src/index";
export default function Pricing() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <span className="eyebrow">PREDICTABLE BY DESIGN</span>
        <h1>Start small. Grow deliberately.</h1>
        <p>
          Proposed prices for customer research. Only the free monitor
          entitlement is currently enforced. Paid subscriptions and checkout are
          disabled.
        </p>
        <div className="plan-scroll">
          <table className="plan-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Monthly price</th>
                <th>Monitors</th>
                <th>Minimum interval</th>
                <th>Retention target</th>
                <th>API requests/month</th>
                <th>Team target</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(plans).map(([name, p]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>${p.price}</td>
                  <td>{p.monitors}</td>
                  <td>{p.interval / 60} min</td>
                  <td>{p.retentionDays} days</td>
                  <td>{p.requests.toLocaleString("en-US")}</td>
                  <td>{p.members}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="notice">
          Retention jobs, monthly quota enforcement, paid team allowances and
          alert limits are not implemented. API keys currently have a shared
          database-backed 60 requests/minute limit per key. No SLA or guaranteed
          support response is offered.
        </div>
        <h2>Before billing goes live</h2>
        <p>
          Validate provider country and business eligibility, actual check
          costs, taxes, webhook signatures, event idempotency and entitlement
          changes using end-to-end test payments. A browser redirect is never
          payment confirmation.
        </p>
      </main>
      <Footer />
    </>
  );
}
