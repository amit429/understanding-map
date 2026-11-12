import { gitIn, makeRepo } from './repo';
import { AGENT, body, daysAgo } from './fixture';

/** Import lines first, then filler so every folder stays its own zone (over the 150-line merge floor). */
const src = (imports: string[], tag: string) => [...imports, body(tag)].join('\n');

/**
 * A small product: web/pages → src/api → src/payments (3 files, agent-written, so it is the top danger zone)
 * → src/email, plus a test importing payments.
 */
export function journeyRepo(): string {
  const root = makeRepo([
    {
      files: {
        'web/pages/checkout.ts': src(["import { checkout } from '../../src/api/checkout';", 'app.get(\'/checkout\', checkout);'], 'page'),
        'src/api/checkout.ts': src(["import { charge } from '../payments/charge';"], 'api'),
        'src/email/receipt.ts': src([], 'mail'),
        'test/payments.test.ts': src(["import { charge } from '../src/payments/charge';"], 'test'),
      },
      date: daysAgo(30),
    },
    {
      files: {
        'src/payments/charge.ts': src(["import { send } from './stripe';", "import { write } from './ledger';"], 'charge'),
        'src/payments/stripe.ts': src([], 'stripe'),
        'src/payments/ledger.ts': src(["import { receipt } from '../email/receipt';"], 'ledger'),
      },
      date: daysAgo(10),
      message: AGENT,
    },
  ]);
  gitIn(root, ['config', 'user.email', 'dev@example.com']);
  return root;
}
