import type { SiteContent } from "@/lib/content";
import type {
  Engagement,
  FeatureValue,
  ServicePricing as Pricing,
} from "@/lib/pricing";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import styles from "./ServicePricing.module.css";

type Labels = SiteContent["servicesPage"]["pricing"];

function Mark({ value, labels }: { value: FeatureValue; labels: Labels }) {
  if (value === "yes") {
    return (
      <span className={styles.yes}>
        <span aria-hidden="true">✓</span>
        <span className="visually-hidden">{labels.yes}</span>
      </span>
    );
  }
  if (value === "extra")
    return <span className={styles.extra}>{labels.extra}</span>;
  if (value === "no") {
    return (
      <span className={styles.no}>
        <span aria-hidden="true">-</span>
        <span className="visually-hidden">{labels.no}</span>
      </span>
    );
  }
  return <span className={styles.text}>{value}</span>;
}

function Badge({ id, labels }: { id?: string; labels: Labels }) {
  const text = id ? labels.badges?.[id as keyof Labels["badges"]] : undefined;
  return text ? <span className={styles.badge}>{text}</span> : null;
}

export function ServicePricing({
  pricing,
  engagements,
  labels,
  ctaHref,
}: {
  pricing: Pricing;
  engagements: Engagement[];
  labels: Labels;
  ctaHref: string;
}) {
  return (
    <section className={styles.section}>
      <Container>
        <h2 className={styles.heading}>
          <SwiftUpText text={labels.heading} whenVisible />
        </h2>
        <p className={styles.intro}>
          <SwiftUpText
            text={labels.intro}
            whenVisible
            lineDelay={0.12}
            delay={0.2}
          />
        </p>

        <RevealGroup as="ul" className={styles.plans}>
          {pricing.plans.map((plan) => (
            <li
              key={plan.id}
              className={`${styles.plan} ${plan.badge ? styles.featured : ""}`}
            >
              <div className={styles.summary}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <Badge id={plan.badge} labels={labels} />
                <p className={styles.blurb}>{plan.blurb}</p>

                <dl className={styles.prices}>
                  <div className={styles.mellonPrice}>
                    <dt>{labels.mellon}</dt>
                    <dd>
                      {plan.mellonUpTo
                        ? labels.upTo.replace("{price}", plan.mellon)
                        : plan.mellon}
                      {pricing.unit && (
                        <span className={styles.unit}> {labels.perMonth}</span>
                      )}
                    </dd>
                  </div>
                  <div className={styles.marketPrice}>
                    <dt>{labels.market}</dt>
                    <dd>
                      {plan.marketUpTo
                        ? labels.upTo.replace("{price}", plan.market)
                        : plan.market}
                      {pricing.unit && (
                        <span className={styles.unit}> {labels.perMonth}</span>
                      )}
                    </dd>
                  </div>
                  <div className={styles.timeline}>
                    <dt>{labels.timeline}</dt>
                    <dd>{plan.timeline}</dd>
                  </div>
                </dl>
              </div>

              <table className={styles.compare}>
                <thead>
                  <tr>
                    <th scope="col">{labels.feature}</th>
                    <th scope="col" className={styles.colMellon}>
                      {labels.mellon}
                    </th>
                    <th scope="col">{labels.market}</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.features.map((feature) => (
                    <tr key={feature.label}>
                      <th scope="row">{feature.label}</th>
                      <td className={styles.colMellon}>
                        <Mark value={feature.mellon} labels={labels} />
                      </td>
                      <td>
                        <Mark value={feature.market} labels={labels} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <a
                className={`${styles.request} ${styles.planRequest}`}
                href={ctaHref}
              >
                {labels.request}
              </a>
            </li>
          ))}
        </RevealGroup>

        {engagements.length > 0 && (
          <div className={styles.engagements}>
            <h3 className={styles.engagementsHeading}>
              <SwiftUpText text={labels.engagementsHeading} whenVisible />
            </h3>
            <RevealGroup as="ul" className={styles.engagementCards}>
              {engagements.map((item) => {
                const unit =
                  item.unit === "hour" ? labels.perHour : labels.perMonth;
                return (
                  <li
                    key={item.id}
                    className={`${styles.engagement} ${item.badge ? styles.featured : ""}`}
                  >
                    <h4 className={styles.planName}>{item.name}</h4>
                    <Badge id={item.badge} labels={labels} />
                    <p className={styles.blurb}>{item.blurb}</p>
                    {item.mellon && item.market ? (
                      <dl className={styles.prices}>
                        <div className={styles.mellonPrice}>
                          <dt>{labels.mellon}</dt>
                          <dd>
                            {item.from && (
                              <span className={styles.from}>
                                {labels.from}{" "}
                              </span>
                            )}
                            {item.mellon}{" "}
                            <span className={styles.unit}>{unit}</span>
                          </dd>
                        </div>
                        <div className={styles.marketPrice}>
                          <dt>{labels.market}</dt>
                          <dd>
                            {item.market}{" "}
                            <span className={styles.unit}>{unit}</span>
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <p className={styles.onRequest}>{labels.onRequest}</p>
                    )}
                    <ul className={styles.includes}>
                      {item.includes.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    <a className={styles.request} href={ctaHref}>
                      {labels.request}
                    </a>
                  </li>
                );
              })}
            </RevealGroup>
          </div>
        )}

        <FadeIn whenVisible>
          <p className={styles.note}>
            {labels.note.replace("{currency}", pricing.currency)}
          </p>
        </FadeIn>
      </Container>
    </section>
  );
}
