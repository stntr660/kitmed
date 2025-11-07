# KITMED User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Admin Panel Overview](#admin-panel-overview)
3. [Product Management](#product-management)
4. [Category Management](#category-management)
5. [RFP Management](#rfp-management)
6. [Partner Management](#partner-management)
7. [Content Management](#content-management)
8. [User Management](#user-management)
9. [Analytics & Reporting](#analytics--reporting)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Admin Panel

#### 1. Admin Login
1. Navigate to `https://kitmed.com/admin/login`
2. Enter your admin credentials
3. Complete two-factor authentication if enabled
4. You'll be redirected to the admin dashboard

#### 2. Dashboard Overview
The admin dashboard provides an at-a-glance view of your platform:
- **Total Products**: Current number of active products
- **Total Categories**: Organized categories and disciplines
- **Active RFPs**: Pending and in-progress requests
- **Recent Activity**: Latest actions performed on the platform

#### 3. Navigation Menu
The left sidebar contains main navigation sections:
- **Dashboard**: Overview and quick actions
- **Products**: Product catalog management
- **Categories**: Category and discipline organization
- **RFPs**: Request for proposal workflow
- **Partners**: Company and partner management
- **Content**: Banners and page content
- **Users**: User accounts and permissions
- **Analytics**: Reports and insights

### User Roles and Permissions

#### Administrator
- Full access to all platform features
- Can create, edit, and delete all content
- User management capabilities
- System configuration access

#### Editor
- Can create and edit products, categories
- Can manage RFPs and respond to requests
- Cannot delete critical content or manage users
- Limited access to analytics

#### Viewer
- Read-only access to all content
- Can view RFPs and analytics
- Cannot make changes to any content
- Useful for stakeholders and auditors

## Admin Panel Overview

### Dashboard Widgets

#### Quick Stats
- **Products Added Today**: Real-time count of new products
- **RFPs This Month**: Monthly RFP submission tracking
- **Popular Categories**: Most viewed product categories
- **System Health**: Platform status indicators

#### Recent Activity Feed
Shows the latest 10 actions performed on the platform:
- Product additions/modifications
- RFP submissions and status changes
- User logins and actions
- System events and alerts

#### Quick Actions
Commonly used functions accessible from the dashboard:
- **Add New Product**: Direct link to product creation
- **Bulk Import**: CSV product import functionality
- **Export Data**: Generate reports and data exports
- **System Settings**: Access platform configuration

### Global Search
Use the search bar in the top navigation to quickly find:
- Products by name, SKU, or description
- Categories by name
- RFPs by reference number or company
- Partners by name
- Users by name or email

## Product Management

### Adding New Products

#### 1. Basic Information
Navigate to **Products > Add New Product**

**Required Fields:**
- **Product Name**: Clear, descriptive name (max 255 characters)
- **SKU**: Unique product identifier (format: ABC-12345)
- **Category**: Select from existing categories/disciplines
- **Short Description**: Brief overview (max 500 characters)

**Optional Fields:**
- **Long Description**: Detailed product information
- **Specifications**: Technical details in JSON format
- **Status**: Active, Inactive, or Discontinued
- **Featured**: Check to highlight on homepage

#### 2. Multi-Language Support
For each language (French/English):
- **Translated Name**: Product name in target language
- **Translated Description**: Localized descriptions
- **Translated Specifications**: Language-specific technical details

#### 3. Media Management
**Adding Images:**
1. Click "Upload Images" in the Media section
2. Select high-quality images (max 10MB each)
3. Set alt text for accessibility
4. Mark one image as primary

**Supported Formats:**
- Images: JPEG, PNG, WebP
- Documents: PDF, DOC, DOCX
- Maximum file size: 10MB

**Image Requirements:**
- Minimum resolution: 800x600px
- Recommended aspect ratio: 4:3 or 16:9
- Professional product photography preferred

#### 4. Product Attributes
Add custom attributes for detailed specifications:
- **Attribute Name**: e.g., "Weight", "Dimensions", "Power"
- **Attribute Value**: Specific measurement or specification
- **Attribute Type**: Text, Number, Boolean, or Select

#### 5. SEO Settings
Optimize for search engines:
- **Meta Title**: 50-60 characters
- **Meta Description**: 150-160 characters
- **URL Slug**: Auto-generated or custom

### Bulk Product Import

#### 1. CSV Template
Download the CSV template from **Products > Bulk Import**

**Required Columns:**
```csv
sku,name,category_id,short_description,status
ABC-001,"Digital Stethoscope",1,"High-quality digital stethoscope",active
ABC-002,"Blood Pressure Monitor",2,"Automatic blood pressure monitor",active
```

**Optional Columns:**
- `long_description`
- `specifications` (JSON format)
- `is_featured` (true/false)
- `name_fr` (French translation)
- `short_description_fr`

#### 2. Import Process
1. Prepare your CSV file following the template
2. Navigate to **Products > Bulk Import**
3. Upload your CSV file
4. Review the import preview
5. Click "Import Products" to confirm

**Import Validation:**
- Duplicate SKUs will be rejected
- Invalid category IDs will cause errors
- Missing required fields will skip rows
- Detailed error report provided after import

#### 3. Import Results
After import completion:
- **Success Count**: Number of products imported
- **Error Count**: Number of failed imports
- **Error Details**: Specific error messages for failed rows
- **Rollback Option**: Undo import if needed (within 24 hours)

### Product Search and Filtering

#### Advanced Search
Use filters to find specific products:
- **Text Search**: Search in name, description, SKU
- **Category Filter**: Filter by specific categories
- **Status Filter**: Active, Inactive, Discontinued
- **Featured Filter**: Show only featured products
- **Date Range**: Products added within specific dates

#### Bulk Actions
Select multiple products to perform bulk operations:
- **Change Status**: Activate/deactivate multiple products
- **Export Selected**: Export specific products to CSV
- **Delete Selected**: Remove multiple products (with confirmation)
- **Update Categories**: Move products to different categories

### Product Analytics
View detailed analytics for each product:
- **View Count**: How many times the product was viewed
- **RFP Inclusions**: Number of RFP requests including this product
- **Popular Search Terms**: Keywords leading to this product
- **Geographic Interest**: Regions showing most interest

## Category Management

### Category Hierarchy

#### 1. Creating Categories
Navigate to **Categories > Add New Category**

**Basic Information:**
- **Category Name**: Clear, descriptive name
- **Parent Category**: Select parent for hierarchical organization
- **Description**: Detailed category description
- **Sort Order**: Numerical order for display

**Visual Elements:**
- **Category Image**: Representative image for the category
- **Icon**: Small icon for navigation menus
- **Color Theme**: Accent color for category identification

#### 2. Multilingual Categories
Provide translations for international users:
- **French Name**: Translated category name
- **French Description**: Localized category description
- **URL Slugs**: Language-specific URL paths

#### 3. Category Metadata
**SEO Configuration:**
- **Meta Title**: Search engine title
- **Meta Description**: Search engine description
- **Canonical URL**: Preferred URL for search engines

**Display Settings:**
- **Show in Navigation**: Include in main menu
- **Featured Category**: Highlight on homepage
- **Product Display Layout**: Grid, list, or card view

### Organizing Categories

#### Hierarchical Structure
Create logical category trees:
```
Medical Devices
├── Diagnostic Equipment
│   ├── Stethoscopes
│   ├── Blood Pressure Monitors
│   └── Thermometers
├── Surgical Instruments
│   ├── Scissors
│   ├── Forceps
│   └── Scalpels
└── Patient Monitoring
    ├── ECG Machines
    ├── Pulse Oximeters
    └── Vital Sign Monitors
```

#### Best Practices
- **Maximum Depth**: Limit to 4 levels for usability
- **Clear Naming**: Use industry-standard terminology
- **Logical Grouping**: Group related products together
- **Regular Review**: Periodically audit category structure

### Category Management Tools

#### Drag-and-Drop Reordering
1. Navigate to **Categories > Manage Hierarchy**
2. Drag categories to reorder within same level
3. Drop categories onto others to change parent
4. Save changes to apply new structure

#### Bulk Category Operations
- **Merge Categories**: Combine similar categories
- **Split Categories**: Divide overpopulated categories
- **Mass Reassignment**: Move all products to different category
- **Duplicate Detection**: Find and merge duplicate categories

## RFP Management

### RFP Workflow Overview

#### 1. RFP Status Flow
```
New → Under Review → Quoted → Accepted/Declined → Closed
```

**Status Definitions:**
- **New**: Recently submitted, awaiting review
- **Under Review**: Being processed by sales team
- **Quoted**: Price quote has been provided
- **Accepted**: Customer accepted the quote
- **Declined**: Customer declined or expired
- **Closed**: Final status, archived

#### 2. RFP Dashboard
Access via **RFPs > Dashboard**

**Key Metrics:**
- **Total RFPs**: All-time submission count
- **Active RFPs**: Currently in progress
- **Conversion Rate**: Percentage of RFPs resulting in sales
- **Average Response Time**: Time to provide quotes
- **Revenue Pipeline**: Potential revenue from active RFPs

### Managing Individual RFPs

#### 1. RFP Details View
Click any RFP to view complete information:

**Customer Information:**
- Company name and contact details
- Customer's specific requirements
- Preferred contact method and urgency level

**Requested Products:**
- Product list with quantities
- Special requirements or specifications
- Individual product pricing

**Communication History:**
- All interactions with the customer
- Internal notes and status changes
- Attached documents and quotes

#### 2. Updating RFP Status
**Status Change Process:**
1. Open the RFP details page
2. Click "Change Status" button
3. Select new status from dropdown
4. Add notes explaining the change
5. Set follow-up reminders if needed
6. Save changes

**Required Actions by Status:**
- **Under Review**: Assign to team member
- **Quoted**: Upload quote document, set expiration date
- **Accepted**: Enter final pricing, create sales order
- **Declined**: Record reason for future analysis

#### 3. Quote Generation
**Creating Quotes:**
1. Review all requested products and quantities
2. Click "Generate Quote" button
3. Set pricing for each product line item
4. Add terms and conditions
5. Set quote expiration date
6. Generate PDF quote document
7. Email automatically to customer

**Quote Template Customization:**
- Company logo and branding
- Standard terms and conditions
- Payment terms and methods
- Delivery timeframes
- Contact information

### RFP Analytics and Reporting

#### 1. Performance Metrics
Track key performance indicators:
- **Response Time**: Average time to first response
- **Quote Accuracy**: How often quotes are accepted
- **Customer Satisfaction**: Survey results and feedback
- **Product Popularity**: Most requested products

#### 2. Sales Pipeline Analysis
- **Revenue Forecasting**: Projected sales from active RFPs
- **Conversion Funnel**: Drop-off rates at each stage
- **Geographic Analysis**: RFP distribution by region
- **Seasonal Trends**: Monthly and quarterly patterns

#### 3. Custom Reports
Generate detailed reports:
- **Date Range Selection**: Custom time periods
- **Filter Options**: By status, customer, product category
- **Export Formats**: PDF, Excel, CSV
- **Scheduled Reports**: Automatic weekly/monthly reports

### RFP Automation

#### 1. Auto-Assignment Rules
Set up automatic RFP assignment:
- **Geographic Rules**: Assign based on customer location
- **Product Category Rules**: Route by expertise area
- **Workload Balancing**: Distribute evenly among team
- **Priority Rules**: Handle urgent RFPs first

#### 2. Follow-up Reminders
Automate customer follow-up:
- **Quote Follow-up**: Reminder after quote delivery
- **Response Deadlines**: Alert before quote expiration
- **Check-in Schedule**: Regular customer touchpoints
- **Escalation Rules**: Alert management for overdue items

## Partner Management

### Adding New Partners

#### 1. Partner Information
Navigate to **Partners > Add New Partner**

**Basic Details:**
- **Company Name**: Official registered name
- **Display Name**: Name shown on website
- **Website URL**: Partner's official website
- **Contact Email**: Primary contact information

**Business Information:**
- **Industry**: Medical device sector/specialty
- **Company Size**: Small, Medium, Large enterprise
- **Established Date**: When company was founded
- **Headquarters Location**: Primary business address

#### 2. Partnership Details
**Partnership Type:**
- **Distributor**: Sells KITMED products
- **Manufacturer**: Produces medical equipment
- **Service Provider**: Maintenance and support
- **Technology Partner**: Software/tech integration

**Partnership Status:**
- **Active**: Currently working together
- **Pending**: Under negotiation
- **Inactive**: Temporarily suspended
- **Terminated**: Partnership ended

#### 3. Visual Assets
**Logo Management:**
- Upload high-resolution logo (PNG preferred)
- Minimum size: 200x200px
- Transparent background recommended
- Multiple formats for different uses

**Marketing Materials:**
- Company brochures and catalogs
- Product specification sheets
- Certification documents
- Case studies and testimonials

### Partner Showcase Management

#### 1. Featured Partners
Select partners to highlight on the website:
- **Homepage Carousel**: Rotating partner showcase
- **Partner Page**: Dedicated partner directory
- **Product Pages**: Show relevant partners per product
- **Footer Links**: Quick access to key partners

#### 2. Partner Categories
Organize partners by:
- **Geographic Region**: North America, Europe, Asia
- **Product Category**: What products they specialize in
- **Partnership Level**: Gold, Silver, Bronze tiers
- **Services Offered**: Sales, support, training

### Partner Portal Access

#### 1. Creating Partner Accounts
**Account Setup Process:**
1. Navigate to **Partners > Portal Access**
2. Select partner from list
3. Click "Create Portal Account"
4. Enter contact person details
5. Set access permissions
6. Send login credentials

**Access Levels:**
- **View Only**: Access to product catalogs and prices
- **Order Management**: Can place orders and track status
- **Marketing Materials**: Access to promotional content
- **Training Resources**: Product training and certification

#### 2. Partner Analytics
Track partner performance:
- **Sales Volume**: Revenue generated by partner
- **Product Distribution**: Which products they sell most
- **Geographic Coverage**: Market areas covered
- **Customer Satisfaction**: Feedback on partner services

## Content Management

### Banner Management

#### 1. Creating Banners
Navigate to **Content > Banners > Add New**

**Banner Types:**
- **Homepage Hero**: Large promotional banners
- **Category Banners**: Specific to product categories
- **Promotional**: Special offers and announcements
- **Informational**: Company news and updates

**Design Specifications:**
- **Homepage Hero**: 1920x600px
- **Category Banners**: 1200x300px
- **Side Banners**: 300x250px
- **Mobile Optimized**: Responsive design required

#### 2. Banner Content
**Text Elements:**
- **Headline**: Attention-grabbing title (max 60 characters)
- **Subheading**: Supporting message (max 120 characters)
- **Call-to-Action**: Clear action button text
- **Description**: Additional context if needed

**Visual Elements:**
- **Background Image**: High-quality, professional imagery
- **Logo Placement**: Brand positioning
- **Color Scheme**: Consistent with brand guidelines
- **Typography**: Readable fonts and sizes

#### 3. Banner Scheduling
**Publication Settings:**
- **Start Date**: When banner becomes active
- **End Date**: When banner expires
- **Time Zone**: Consider target audience location
- **Priority**: Order when multiple banners compete

**Target Audiences:**
- **Geographic**: Show to specific regions
- **Language**: Display in appropriate language
- **User Type**: New visitors vs. returning customers
- **Device Type**: Desktop, tablet, or mobile specific

### Page Content Management

#### 1. Static Pages
Manage informational pages:
- **About Us**: Company history and mission
- **Contact Information**: Office locations and details
- **Privacy Policy**: Data protection policies
- **Terms of Service**: Platform usage terms
- **FAQ**: Frequently asked questions

#### 2. Dynamic Content
**News and Updates:**
- **Company News**: Press releases and announcements
- **Product Updates**: New releases and improvements
- **Industry News**: Relevant medical device industry news
- **Event Coverage**: Trade shows and conferences

**Content Workflow:**
1. **Draft**: Create and edit content
2. **Review**: Internal approval process
3. **Scheduled**: Set publication date
4. **Published**: Live on website
5. **Archived**: Moved to historical content

### SEO Content Optimization

#### 1. On-Page SEO
**Meta Information:**
- **Title Tags**: Unique, descriptive titles
- **Meta Descriptions**: Compelling summaries
- **Header Tags**: Proper H1, H2, H3 structure
- **Alt Text**: Descriptive image alternative text

**Content Guidelines:**
- **Keyword Integration**: Natural keyword placement
- **Content Length**: Appropriate depth for topic
- **Internal Linking**: Connect related pages
- **External Links**: Credible sources only

#### 2. Technical SEO
**Site Structure:**
- **URL Structure**: Clean, descriptive URLs
- **Sitemap**: XML sitemap generation
- **Robots.txt**: Search engine crawling guidelines
- **Canonical URLs**: Prevent duplicate content issues

## User Management

### User Accounts

#### 1. Creating New Users
Navigate to **Users > Add New User**

**Basic Information:**
- **First Name**: User's given name
- **Last Name**: User's family name
- **Email Address**: Unique login identifier
- **Phone Number**: Contact information
- **Department**: User's work department

**Account Settings:**
- **Username**: Login name (auto-generated from email)
- **Initial Password**: Temporary password for first login
- **Role Assignment**: Select appropriate user role
- **Status**: Active, Inactive, or Suspended

#### 2. User Roles and Permissions
**Role Definitions:**

**Super Administrator:**
- Complete system access
- User management capabilities
- System configuration
- Security settings

**Administrator:**
- Full content management
- User creation (limited roles)
- Analytics access
- Most system features

**Editor:**
- Content creation and editing
- Product management
- RFP management
- Limited deletion rights

**Viewer:**
- Read-only access
- Report generation
- No editing capabilities
- Audit and compliance use

#### 3. User Profile Management
**Profile Information:**
- **Profile Photo**: User avatar image
- **Bio**: Brief professional description
- **Contact Preferences**: Communication settings
- **Language Preference**: Interface language
- **Time Zone**: Local time zone setting

### Security Management

#### 1. Password Policies
**Password Requirements:**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common dictionary words
- Cannot reuse last 5 passwords
- Expires every 90 days

**Password Reset Process:**
1. User requests password reset
2. Verification email sent
3. Secure reset link provided
4. New password must meet requirements
5. All sessions invalidated

#### 2. Two-Factor Authentication (2FA)
**Setup Process:**
1. Navigate to **Security Settings**
2. Enable 2FA for user account
3. Generate QR code for authenticator app
4. User scans code with Google Authenticator/Authy
5. Verify setup with test code
6. Generate backup codes

**2FA Management:**
- **Mandatory 2FA**: Require for admin users
- **Optional 2FA**: Available for all users
- **Backup Codes**: Emergency access codes
- **Device Management**: Trusted device registration

#### 3. Session Management
**Session Controls:**
- **Session Timeout**: Auto-logout after inactivity
- **Concurrent Sessions**: Limit simultaneous logins
- **Device Tracking**: Monitor login devices
- **Geographic Alerts**: Unusual location notifications

### User Activity Monitoring

#### 1. Audit Logs
Track all user actions:
- **Login/Logout Events**: Authentication history
- **Content Changes**: What was modified and when
- **Permission Changes**: Role and access modifications
- **Failed Attempts**: Security incident tracking

#### 2. User Analytics
Monitor user engagement:
- **Login Frequency**: How often users access system
- **Feature Usage**: Which features are used most
- **Time Spent**: Average session duration
- **Popular Actions**: Most common user activities

## Analytics & Reporting

### Dashboard Analytics

#### 1. Key Performance Indicators
**Business Metrics:**
- **Total Revenue**: Sales from RFP conversions
- **Conversion Rate**: RFP to sale percentage
- **Average Order Value**: Mean sale amount
- **Customer Acquisition Cost**: Marketing efficiency

**Platform Metrics:**
- **Active Users**: Regular platform users
- **Page Views**: Most visited pages
- **Bounce Rate**: Single-page visit percentage
- **Search Success Rate**: Successful product searches

#### 2. Real-Time Monitoring
**Live Statistics:**
- **Current Visitors**: Users online now
- **Active RFPs**: Currently open requests
- **Recent Orders**: Latest successful conversions
- **System Health**: Platform performance status

### Custom Reports

#### 1. Report Builder
Create custom reports with:
- **Date Range Selection**: Custom time periods
- **Data Source Selection**: Choose metrics to include
- **Filter Options**: Narrow down data by criteria
- **Visualization Types**: Charts, graphs, tables
- **Export Formats**: PDF, Excel, CSV, PNG

#### 2. Scheduled Reports
**Automated Reporting:**
- **Daily Reports**: Key metrics summary
- **Weekly Reports**: Detailed performance analysis
- **Monthly Reports**: Comprehensive business review
- **Quarterly Reports**: Strategic planning data

**Distribution Settings:**
- **Email Recipients**: Who receives reports
- **Delivery Schedule**: When reports are sent
- **Format Preferences**: Report format per recipient
- **Custom Branding**: Company logo and styling

### Data Export and Integration

#### 1. Data Export Options
**Export Formats:**
- **CSV**: Spreadsheet-compatible format
- **Excel**: Microsoft Excel format
- **PDF**: Print-ready reports
- **JSON**: API-compatible data format

**Export Types:**
- **Products**: Complete product catalog
- **RFPs**: Request history and status
- **Users**: User accounts and activity
- **Analytics**: Performance metrics

#### 2. API Integration
**Available APIs:**
- **REST API**: Standard HTTP-based access
- **GraphQL**: Flexible data querying
- **Webhooks**: Real-time event notifications
- **Bulk API**: Large data operations

**Authentication:**
- **API Keys**: Secure access tokens
- **OAuth 2.0**: Industry-standard authentication
- **Rate Limiting**: Prevent API abuse
- **Documentation**: Comprehensive API guides

## Troubleshooting

### Common Issues

#### 1. Login Problems
**Forgot Password:**
1. Click "Forgot Password" on login page
2. Enter email address
3. Check email for reset link
4. Click link and set new password
5. Ensure new password meets requirements

**Account Locked:**
- Contact system administrator
- Administrator can unlock in **Users > Manage Users**
- Check for failed login attempts
- Review security logs for suspicious activity

#### 2. File Upload Issues
**Supported File Types:**
- Images: JPEG, PNG, WebP, GIF
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Maximum size: 10MB per file

**Upload Failures:**
- Check file size (must be under 10MB)
- Verify file format is supported
- Ensure stable internet connection
- Try using different browser
- Clear browser cache and cookies

#### 3. Search and Filtering Problems
**No Search Results:**
- Check spelling and try alternative terms
- Use broader search criteria
- Verify filters are not too restrictive
- Clear all filters and try again

**Slow Search Performance:**
- Use more specific search terms
- Apply filters to narrow results
- Check internet connection speed
- Contact support if issue persists

### Getting Help

#### 1. In-App Help
**Help Documentation:**
- **Help Button**: Available on every page
- **Tooltips**: Hover over elements for quick help
- **Guided Tours**: Step-by-step feature walkthroughs
- **Video Tutorials**: Screen recordings of common tasks

#### 2. Support Contacts
**Technical Support:**
- **Email**: support@kitmed.com
- **Phone**: +1 (555) 123-4567
- **Hours**: Monday-Friday, 9 AM - 6 PM EST
- **Response Time**: 4-8 hours for email, immediate for phone

**Training and Onboarding:**
- **Scheduled Training**: Group training sessions
- **One-on-One Training**: Personalized instruction
- **Documentation**: Comprehensive user guides
- **Video Library**: Self-paced learning resources

#### 3. Feature Requests
**Submitting Requests:**
1. Navigate to **Help > Feature Request**
2. Describe the desired feature
3. Explain the business case
4. Provide examples if applicable
5. Submit for development team review

**Request Status:**
- **Under Review**: Being evaluated
- **Planned**: Added to development roadmap
- **In Development**: Currently being built
- **Released**: Feature is live

### Browser Compatibility

#### Supported Browsers
**Fully Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Limited Support:**
- Internet Explorer 11 (basic functionality only)
- Older mobile browsers (reduced features)

**Recommended Settings:**
- JavaScript enabled
- Cookies enabled
- Pop-up blocker disabled for KITMED domains
- Latest browser version installed

This user manual provides comprehensive guidance for effectively using the KITMED admin panel. For additional support or training, contact the support team using the information provided in the troubleshooting section.