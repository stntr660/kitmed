# KITMED Component Architecture

## Architecture Overview

**Framework**: Next.js 14 with App Router
**UI Library**: shadcn/ui + Tailwind CSS
**State Management**: Zustand + TanStack Query
**Type Safety**: TypeScript with strict mode

```
src/
├── app/                    # Next.js App Router
├── components/             # Reusable UI components
├── lib/                    # Utilities and configurations
├── hooks/                  # Custom React hooks
├── store/                  # State management
├── types/                  # TypeScript definitions
└── styles/                 # Global styles
```

## 1. Core Architecture Principles

### 1.1 Component Hierarchy
```
Page Components (app/)
├── Layout Components
├── Feature Components (complex business logic)
├── UI Components (shadcn/ui + custom)
└── Primitive Components (atoms)
```

### 1.2 Data Flow Pattern
```
API → TanStack Query → Zustand Store → Components
                    ↓
                Component State (useState/useReducer)
```

### 1.3 Styling Strategy
```
shadcn/ui (base components) + Tailwind CSS (customization)
├── CSS Variables (theme colors)
├── Component Variants (cva library)
└── Responsive Design (mobile-first)
```

## 2. Component Structure

### 2.1 Directory Organization
```typescript
src/
├── app/                              # App Router pages
│   ├── (public)/                     # Public routes
│   │   ├── page.tsx                  # Homepage
│   │   ├── products/                 # Product catalog
│   │   │   ├── page.tsx             # Product listing
│   │   │   ├── [slug]/              
│   │   │   │   └── page.tsx         # Product detail
│   │   │   └── category/
│   │   │       └── [slug]/page.tsx   # Category page
│   │   ├── rfp/
│   │   │   ├── page.tsx             # RFP form
│   │   │   └── status/[ref]/page.tsx # RFP status
│   │   ├── partners/page.tsx         # Partners showcase
│   │   ├── about/page.tsx           # Company info
│   │   └── contact/page.tsx         # Contact form
│   ├── (admin)/                      # Admin routes
│   │   └── admin/
│   │       ├── layout.tsx           # Admin layout
│   │       ├── page.tsx             # Dashboard
│   │       ├── products/            # Product management
│   │       ├── categories/          # Category management
│   │       ├── rfp/                 # RFP management
│   │       ├── partners/            # Partner management
│   │       └── settings/            # Admin settings
│   ├── api/                         # API routes
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── not-found.tsx               # 404 page
├── components/                       # Reusable components
│   ├── ui/                          # shadcn/ui components
│   ├── layout/                      # Layout components
│   ├── features/                    # Feature-specific components
│   │   ├── product/                 # Product-related components
│   │   ├── rfp/                     # RFP-related components
│   │   ├── admin/                   # Admin-specific components
│   │   └── navigation/              # Navigation components
│   └── common/                      # Common utility components
├── lib/                             # Utilities and configurations
│   ├── api.ts                       # API client setup
│   ├── auth.ts                      # Authentication utilities
│   ├── db.ts                        # Database connection
│   ├── utils.ts                     # General utilities
│   ├── constants.ts                 # App constants
│   └── validations/                 # Zod schemas
├── hooks/                           # Custom React hooks
│   ├── use-api.ts                   # API hooks
│   ├── use-auth.ts                  # Authentication hooks
│   ├── use-language.ts              # Internationalization hooks
│   └── use-products.ts              # Product-specific hooks
├── store/                           # Zustand stores
│   ├── auth-store.ts                # Authentication state
│   ├── cart-store.ts                # RFP cart state
│   ├── admin-store.ts               # Admin UI state
│   └── global-store.ts              # Global app state
├── types/                           # TypeScript definitions
│   ├── api.ts                       # API response types
│   ├── database.ts                  # Database entity types
│   └── components.ts                # Component prop types
└── styles/                          # Additional styles
    └── components.css               # Component-specific styles
```

## 3. Component Specifications

### 3.1 Layout Components

#### MainLayout
```typescript
// components/layout/main-layout.tsx
interface MainLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  showFooter?: boolean
  className?: string
}

export function MainLayout({
  children,
  showHeader = true,
  showFooter = true,
  className
}: MainLayoutProps) {
  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {showHeader && <Header />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}
```

#### AdminLayout
```typescript
// components/layout/admin-layout.tsx
interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!user) redirect('/admin/login')

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 3.2 Navigation Components

#### Header
```typescript
// components/layout/header.tsx
export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <MainNavigation />
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <RFPCartIcon />
            <SearchToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

// Sub-components
function MainNavigation() {
  const { data: categories } = useCategories()
  
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <CategoryMegaMenu categories={categories} />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/partners">Partners</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/about">About</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/contact">Contact</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

#### CategoryMegaMenu
```typescript
// components/features/navigation/category-mega-menu.tsx
interface CategoryMegaMenuProps {
  categories: Category[]
}

export function CategoryMegaMenu({ categories }: CategoryMegaMenuProps) {
  return (
    <div className="grid grid-cols-4 gap-6 p-6 w-[800px]">
      {categories.map((category) => (
        <div key={category.id} className="space-y-3">
          <Link 
            href={`/products/category/${category.slug}`}
            className="font-semibold text-[#1C75BC] hover:underline"
          >
            {category.name}
          </Link>
          {category.children?.map((subcategory) => (
            <Link
              key={subcategory.id}
              href={`/products/category/${subcategory.slug}`}
              className="block text-sm text-gray-600 hover:text-gray-900"
            >
              {subcategory.name}
            </Link>
          ))}
        </div>
      ))}
    </div>
  )
}
```

### 3.3 Product Components

#### ProductCard
```typescript
// components/features/product/product-card.tsx
interface ProductCardProps {
  product: Product
  showAddToRFP?: boolean
  variant?: 'default' | 'featured' | 'compact'
}

export function ProductCard({ 
  product, 
  showAddToRFP = true,
  variant = 'default' 
}: ProductCardProps) {
  const addToCart = useRFPCart((state) => state.addItem)
  
  return (
    <Card className={cn(
      "group cursor-pointer hover:shadow-lg transition-shadow",
      variant === 'featured' && "border-[#1C75BC] border-2",
      variant === 'compact' && "max-w-[200px]"
    )}>
      <CardContent className="p-4">
        <div className="aspect-square relative mb-3">
          <Image
            src={product.primaryImage || '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-cover rounded-md"
          />
          {product.isFeatured && (
            <Badge className="absolute top-2 right-2 bg-[#ED1C24]">
              Featured
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-2 group-hover:text-[#1C75BC]">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3">
            {product.shortDescription}
          </p>
          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Link href={`/products/${product.slug}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
          {showAddToRFP && (
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                addToCart(product)
              }}
              className="bg-[#1C75BC] hover:bg-[#1C75BC]/90"
            >
              Add to RFP
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### ProductDetail
```typescript
// components/features/product/product-detail.tsx
interface ProductDetailProps {
  product: ProductDetail
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const addToCart = useRFPCart((state) => state.addItem)
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="aspect-square relative">
          <Image
            src={product.media[selectedImage]?.url || '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-cover rounded-lg"
          />
        </div>
        
        {product.media.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto">
            {product.media.map((media, index) => (
              <button
                key={media.id}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "flex-shrink-0 w-20 h-20 relative rounded-md overflow-hidden border-2",
                  selectedImage === index ? "border-[#1C75BC]" : "border-gray-200"
                )}
              >
                <Image
                  src={media.url}
                  alt={media.altText || product.name}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <Breadcrumb>
            {product.category.breadcrumb.map((crumb, index) => (
              <BreadcrumbItem key={index}>
                <BreadcrumbLink href={`/products/category/${crumb.slug}`}>
                  {crumb.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-lg text-gray-600 mt-2">SKU: {product.sku}</p>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{product.shortDescription}</p>
        </div>
        
        {product.specifications && (
          <ProductSpecifications specifications={product.specifications} />
        )}
        
        {product.attributes.length > 0 && (
          <ProductAttributes attributes={product.attributes} />
        )}
        
        <div className="flex space-x-4">
          <Button
            size="lg"
            onClick={() => addToCart(product)}
            className="bg-[#1C75BC] hover:bg-[#1C75BC]/90"
          >
            Add to RFP Request
          </Button>
          <Button variant="outline" size="lg">
            Download Brochure
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### 3.4 RFP Components

#### RFPCart
```typescript
// components/features/rfp/rfp-cart.tsx
export function RFPCart() {
  const { items, removeItem, updateQuantity } = useRFPCart()
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-[#ED1C24]"
            >
              {items.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h3 className="font-semibold">RFP Request Items</h3>
          
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No items in your RFP request
            </p>
          ) : (
            <>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <RFPCartItem
                    key={item.productId}
                    item={item}
                    onRemove={removeItem}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </div>
              
              <div className="border-t pt-3">
                <Link href="/rfp">
                  <Button className="w-full bg-[#1C75BC] hover:bg-[#1C75BC]/90">
                    Submit RFP Request ({items.length} items)
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Sub-component
function RFPCartItem({ item, onRemove, onUpdateQuantity }: {
  item: RFPCartItem
  onRemove: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
}) {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 relative">
        <Image
          src={item.product.primaryImage || '/placeholder-product.jpg'}
          alt={item.product.name}
          fill
          className="object-cover rounded"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.product.name}</p>
        <p className="text-xs text-gray-500">{item.product.sku}</p>
      </div>
      
      <div className="flex items-center space-x-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <span className="text-sm w-8 text-center">{item.quantity}</span>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-red-500"
          onClick={() => onRemove(item.productId)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
```

#### RFPForm
```typescript
// components/features/rfp/rfp-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rfpSubmissionSchema } from '@/lib/validations/rfp'

interface RFPFormProps {
  items: RFPCartItem[]
}

export function RFPForm({ items }: RFPFormProps) {
  const form = useForm({
    resolver: zodResolver(rfpSubmissionSchema),
    defaultValues: {
      customerInfo: {
        name: '',
        email: '',
        phone: '',
        companyName: '',
        companyAddress: '',
        contactPerson: ''
      },
      message: '',
      urgencyLevel: 'normal' as const,
      preferredContactMethod: 'email' as const
    }
  })
  
  const { mutate: submitRFP, isPending } = useSubmitRFP()
  
  const onSubmit = (data: any) => {
    submitRFP({
      ...data,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        specialRequirements: item.specialRequirements
      }))
    })
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerInfo.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customerInfo.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Additional form fields... */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="urgencyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Requirements</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormDescription>
                    Please provide any specific requirements or questions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Button 
          type="submit" 
          className="w-full bg-[#1C75BC] hover:bg-[#1C75BC]/90"
          disabled={isPending}
        >
          {isPending ? 'Submitting...' : 'Submit RFP Request'}
        </Button>
      </form>
    </Form>
  )
}
```

### 3.5 Admin Components

#### AdminDataTable
```typescript
// components/features/admin/admin-data-table.tsx
interface AdminDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchKey?: string
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  actions?: React.ReactNode
}

export function AdminDataTable<T>({
  data,
  columns,
  searchKey,
  pagination,
  actions
}: AdminDataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {searchKey && (
          <Input
            placeholder={`Search ${searchKey}...`}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
        {actions}
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => pagination.onPageChange(page)}
                    isActive={page === pagination.page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
```

## 4. Custom Hooks

### 4.1 API Hooks
```typescript
// hooks/use-products.ts
export function useProducts(params?: ProductQuery) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.products.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.products.get(slug),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.products.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create product')
    },
  })
}
```

### 4.2 State Management Hooks
```typescript
// hooks/use-rfp-cart.ts
export function useRFPCart() {
  return useStore(rfpCartStore, (state) => ({
    items: state.items,
    addItem: state.addItem,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    clearCart: state.clearCart,
    getTotalItems: state.getTotalItems,
  }))
}
```

## 5. Performance Optimizations

### 5.1 Code Splitting
```typescript
// Lazy load heavy components
const AdminAnalytics = lazy(() => import('@/components/features/admin/analytics'))
const ProductSpecifications = lazy(() => import('@/components/features/product/specifications'))

// Use Suspense boundaries
<Suspense fallback={<LoadingSpinner />}>
  <AdminAnalytics />
</Suspense>
```

### 5.2 Image Optimization
```typescript
// Use Next.js Image component with optimization
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  quality={80}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 5.3 Virtual Scrolling for Large Lists
```typescript
// Use react-window for large product lists
import { FixedSizeList as List } from 'react-window'

function VirtualizedProductList({ products }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ProductCard product={products[index]} />
    </div>
  )
  
  return (
    <List
      height={600}
      itemCount={products.length}
      itemSize={200}
    >
      {Row}
    </List>
  )
}
```

## 6. Testing Strategy

### 6.1 Component Testing
```typescript
// __tests__/components/product-card.test.tsx
import { render, screen } from '@testing-library/react'
import { ProductCard } from '@/components/features/product/product-card'

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    sku: 'TEST-001',
    slug: 'test-product',
    shortDescription: 'Test description',
    primaryImage: '/test-image.jpg',
    isFeatured: false
  }
  
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('SKU: TEST-001')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })
  
  it('shows add to RFP button when enabled', () => {
    render(<ProductCard product={mockProduct} showAddToRFP={true} />)
    
    expect(screen.getByText('Add to RFP')).toBeInTheDocument()
  })
})
```

This component architecture provides a solid foundation for the KITMED application with proper separation of concerns, reusability, and maintainability. The structure supports both the public front-office and admin back-office requirements while maintaining consistency with shadcn/ui design patterns.