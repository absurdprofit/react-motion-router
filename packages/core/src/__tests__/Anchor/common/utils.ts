export function assertNavigationAvailable() {
  if (!window.navigation) {
    throw new Error('window.navigation is not available in this environment');
  }
}

export async function waitForNavigateSuccess() {
  await window.navigation.transition?.finished;
}

export async function navTo(url: string) {
  const res = window.navigation.navigate(url);
  await res.finished;
}

export async function traverseTo(key: string) {
  const res = window.navigation.traverseTo(key);
  await res.finished;
}

export async function seedHistory() {
  await navTo('/one');
  await navTo('/two');
  await navTo('/three');
}
