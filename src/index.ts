import { ref } from "vue-demi";
import walletconnect from "./connectors/walletconnect";
import injected from "./connectors/injected";
import type {
  JsonRpcFetchFunc,
  ExternalProvider,
} from "@ethersproject/providers";

export function useLock(options: {
  connectors: {
    [key: string]: {
      id: string;
      name: string;
      options?: Record<string, any>;
    };
  };
}) {
  const lockConnectors: {
    [key: string]: typeof walletconnect | typeof injected;
  } = {
    walletconnect,
    injected,
  };

  const isAuthenticated = ref(false);
  const provider = ref<null | JsonRpcFetchFunc | ExternalProvider>(null);

  function getLockConnector(id: string) {
    const connectorOptions = options.connectors[id].options || {};
    return new lockConnectors[id](connectorOptions);
  }

  async function login(id: string) {
    const localProvider = await getLockConnector(id).connect();
    if (localProvider !== null) {
      provider.value = localProvider as JsonRpcFetchFunc | ExternalProvider;
    }
    if (provider.value) {
      localStorage.setItem(`_lock.connector`, id);
      isAuthenticated.value = true;
    }
    return;
  }

  async function logout() {
    const id = await getConnector();
    if (id) {
      getLockConnector(id).logout();
      localStorage.removeItem(`_lock.connector`);
      isAuthenticated.value = false;
      provider.value = null;
    }
    return;
  }

  async function getConnector() {
    const id = localStorage.getItem(`_lock.connector`);
    if (id) {
      const isLoggedIn = await getLockConnector(id).isLoggedIn();
      return isLoggedIn ? id : false;
    }
    return false;
  }

  return {
    isAuthenticated,
    provider,
    login,
    logout,
    getConnector,
    getLockConnector,
  };
}
