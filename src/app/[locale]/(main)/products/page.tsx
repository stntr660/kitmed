import { redirect } from 'next/navigation';

// There is no "all products" listing: the catalogue starts at the
// specialties, so old links and bookmarks land there.
export default function ProductsPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/products/disciplines`);
}
