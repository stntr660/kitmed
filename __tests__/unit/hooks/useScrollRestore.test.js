const { renderHook, act } = require('@testing-library/react');
const { useScrollRestore } = require('../../../src/hooks/useScrollRestore');

const top = { top: 0, left: 0, behavior: 'instant' };

describe('catalogue scroll restore', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    window.scrollTo = jest.fn();
    window.history.replaceState({}, '', '/fr/products/categories/consommables');
    window.sessionStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.scrollTo = originalScrollTo;
  });

  it('waits for catalogue content before resetting to the top', () => {
    const { rerender } = renderHook(({ ready }) => useScrollRestore(ready), {
      initialProps: { ready: false },
    });
    expect(window.scrollTo).not.toHaveBeenCalled();

    rerender({ ready: true });
    expect(window.scrollTo).toHaveBeenCalledWith(top);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);

    rerender({ ready: true });
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('puts the user back on the saved offset after Back', () => {
    window.sessionStorage.setItem(
      'kitmed:scroll:/fr/products/categories/consommables', '2400'
    );
    const productVisit = renderHook(() => useScrollRestore(true));
    productVisit.unmount();
    window.scrollTo.mockClear();

    act(() => window.dispatchEvent(new PopStateEvent('popstate')));
    const { rerender } = renderHook(({ ready }) => useScrollRestore(ready), {
      initialProps: { ready: false },
    });
    expect(window.scrollTo).not.toHaveBeenCalled();
    rerender({ ready: true });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 2400, left: 0, behavior: 'instant' });
  });

  it('starts at the top on a link click even when an offset was saved', () => {
    window.sessionStorage.setItem(
      'kitmed:scroll:/fr/products/categories/consommables', '2400'
    );
    renderHook(() => useScrollRestore(true));
    expect(window.scrollTo).toHaveBeenCalledWith(top);
  });

  it('records the offset while the listing is on screen', () => {
    renderHook(() => useScrollRestore(true));
    Object.defineProperty(window, 'scrollY', { value: 1234, configurable: true });
    act(() => window.dispatchEvent(new Event('scroll')));
    expect(window.sessionStorage.getItem('kitmed:scroll:/fr/products/categories/consommables')).toBe('1234');
  });

  it('resets immediately on a ready arrival without accessing session storage', () => {
    const readStorage = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    renderHook(() => useScrollRestore(true));
    expect(window.scrollTo).toHaveBeenCalledWith(top);
    expect(readStorage).not.toHaveBeenCalled();
  });

  it('resets again when another catalogue finishes loading', () => {
    const { rerender } = renderHook(({ ready }) => useScrollRestore(ready), {
      initialProps: { ready: true },
    });
    window.scrollTo.mockClear();
    rerender({ ready: false });
    expect(window.scrollTo).not.toHaveBeenCalled();
    rerender({ ready: true });
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith(top);
  });
});
