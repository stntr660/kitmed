const { renderHook, act } = require('@testing-library/react');
const { useScrollRestore } = require('../../../src/hooks/useScrollRestore');

const top = { top: 0, left: 0, behavior: 'instant' };

describe('catalogue arrival scroll', () => {
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

  it('returns to the top after Back even when an old offset was saved', () => {
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
    expect(window.scrollTo).toHaveBeenCalledWith(top);
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
