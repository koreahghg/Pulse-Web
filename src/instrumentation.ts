export async function register() {
  // Node.js 22+에서 --localstorage-file 플래그가 유효한 경로 없이 주입되면
  // globalThis.localStorage가 메서드 없는 깨진 객체로 생성됨.
  // Next.js SSR이 이를 감지하고 .getItem() 호출 시 크래시하므로 undefined로 초기화.
  if (
    typeof globalThis.localStorage !== 'undefined' &&
    typeof globalThis.localStorage.getItem !== 'function'
  ) {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
}
