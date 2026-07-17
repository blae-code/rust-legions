import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { install as installDevlog, recordInvoke } from '@/lib/debug/devlog';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// QA/debug instrumentation (observational, no behavior change): wrap the single
// backend choke point so the Dev Console can log every call's action, params,
// timing and result. recordInvoke() is a no-op unless the debug flag is enabled.
installDevlog();
if (base44?.functions?.invoke) {
  const _invoke = base44.functions.invoke.bind(base44.functions);
  base44.functions.invoke = async (name, payload, ...rest) => {
    const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const action = payload && typeof payload === 'object' ? payload.action : undefined;
    const elapsed = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
    try {
      const res = await _invoke(name, payload, ...rest);
      recordInvoke({ name, action, payload, ms: elapsed(), ok: true, status: res?.status, res });
      return res;
    } catch (error) {
      recordInvoke({ name, action, payload, ms: elapsed(), ok: false, status: error?.status, error });
      throw error;
    }
  };
}
