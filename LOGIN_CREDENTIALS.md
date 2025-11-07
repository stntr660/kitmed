# KITMED Platform - Test Login Credentials

## 🔐 Admin Login for Testing

**URL**: [http://localhost:3003/admin/login](http://localhost:3003/admin/login)

### **Test Credentials**
- **Email**: `admin@kitmed.ma`
- **Password**: `admin123`

## 📋 **How to Test**

1. **Navigate to Admin Login**: [http://localhost:3003/admin/login](http://localhost:3003/admin/login)
2. **Enter the credentials above**
3. **Click "Sign In"**
4. **You should be redirected to the admin dashboard**

## ⚙️ **Mock Authentication Details**

For development and testing purposes, the platform uses a simplified mock authentication system:

- **No database required** for testing
- **Instant login** with test credentials
- **JWT token simulation** for session management
- **HTTP-only cookie** for security demonstration

## 🏥 **Admin Features Available**

After login, you can test:
- **Admin Dashboard** - Statistics and overview
- **Product Management** - CRUD operations framework
- **RFP Management** - Request management system
- **User Profile** - Admin user settings

## 🔧 **Authentication Flow Fixed**

**Recent Fix**: Resolved redirect issue after login
- ✅ **Cookie name synchronization** between login API and auth hook
- ✅ **Mock authentication endpoints** properly configured
- ✅ **Token persistence** in localStorage for testing
- ✅ **Automatic redirect** to admin dashboard after successful login

## 🚀 **Expected Login Flow**

1. **Enter credentials** on [/admin/login](http://localhost:3003/admin/login)
2. **Click "Sign In"** 
3. **Authentication validates** against mock user
4. **Token stored** in browser localStorage
5. **Automatic redirect** to [/admin](http://localhost:3003/admin) dashboard
6. **Admin dashboard loads** with authenticated user context

## 🔧 **Troubleshooting**

If login still doesn't redirect:
1. **Check browser console** for any JavaScript errors
2. **Clear localStorage**: `localStorage.clear()` in browser console
3. **Hard refresh**: Ctrl+F5 or Cmd+Shift+R
4. **Try incognito/private** browser window

## 🏗️ **Production Notes**

In production deployment, this mock system should be replaced with:
- Real PostgreSQL database connection
- Proper password hashing (bcrypt)
- Real JWT token generation
- Secure session management
- Rate limiting and security measures

---

**Login should now redirect properly to the admin dashboard!** 🎉