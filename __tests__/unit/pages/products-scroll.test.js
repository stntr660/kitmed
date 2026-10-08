const React = require('react');
const { render, screen, fireEvent, act } = require('@testing-library/react');

jest.mock('next-intl', () => ({ useTranslations: () => (key) => key }));
jest.mock('next/navigation', () => {
  const searchParams = new URLSearchParams();
  return { useSearchParams: () => searchParams };
});
jest.mock('@/hooks/useHydrationSafeParams', () => ({ useHydrationSafeLocale: () => 'fr' }));

const ProductsPage = require('../../../src/app/[locale]/(main)/products/page').default;

const productResponse = { ok: true, json: async () => ({ data: { items: [], total: 0 } }) };

describe('general product listing scroll', () => {
  let pendingProducts;
  const originalFetch = global.fetch;
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    pendingProducts = [];
    window.scrollTo = jest.fn();
    global.fetch = jest.fn((url) => {
      if (url.startsWith('/api/products?')) {
        return new Promise((resolve) => pendingProducts.push(resolve));
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.scrollTo = originalScrollTo;
  });

  async function finishProducts(response = productResponse) {
    expect(pendingProducts).toHaveLength(1);
    await act(async () => pendingProducts.shift()(response));
  }

  it('resets after first load, preserves scroll during searching, and resets on return', async () => {
    const page = render(React.createElement(ProductsPage));
    expect(window.scrollTo).not.toHaveBeenCalled();
    await finishProducts();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    window.scrollTo.mockClear();

    fireEvent.change(screen.getByPlaceholderText('search.placeholder'), { target: { value: 'heine' } });
    await finishProducts();
    expect(window.scrollTo).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Clear search'));
    await finishProducts();
    expect(window.scrollTo).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Toggle advanced filters'));
    fireEvent.click(screen.getByLabelText('search.onlyFeatured'));
    await finishProducts();
    expect(window.scrollTo).not.toHaveBeenCalled();

    page.unmount();
    render(React.createElement(ProductsPage));
    expect(window.scrollTo).not.toHaveBeenCalled();
    await finishProducts();
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('also resets after an unsuccessful initial product response', async () => {
    render(React.createElement(ProductsPage));
    await finishProducts({ ok: false });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });
});
