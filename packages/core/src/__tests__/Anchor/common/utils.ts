export function assertNavigationAvailable() {
  if (!window.navigation) {
    throw new Error('window.navigation is not available in this environment');
  }
}

export async function waitForNavigateSuccess() {
  await new Promise(resolve => {
    window.navigation.addEventListener('navigatesuccess', resolve, { once: true });
  });
}

export async function navTo(url: string) {
  const res = window.navigation.navigate(url);
  await res.finished;
}

export async function traverseTo(key: string) {
  const res = window.navigation.traverseTo(key);
  await res.finished;
}

export async function traverseToStart() {
  const firstEntry = window.navigation.entries()[0];
  const res = window.navigation.traverseTo(firstEntry.key);
  await res.finished;
}

export async function seedHistory() {
  await navTo('/one');
  await navTo('/two');
  await navTo('/three');
}

const interceptor = (event: NavigateEvent) => {
  event.intercept({
    handler() {
      return Promise.resolve();
    },
  });
};
export async function installInterceptor() {
  window.navigation.addEventListener('navigate',interceptor);
}

export async function uninstallInterceptor() {
  window.navigation.removeEventListener('navigate',interceptor);
}