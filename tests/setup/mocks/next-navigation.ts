export function useRouter() {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  };
}

export function usePathname() {
  return "/dashboard";
}

export function useSearchParams() {
  return new URLSearchParams();
}
