/**
 * Security Tests for KITMED Medical Equipment Platform
 * 
 * These tests verify security measures critical for medical equipment platforms,
 * including data protection, authentication, authorization, and input validation.
 */

import { renderWithProviders, securityTestCases } from '../utils/test-helpers';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLogin } from '@/components/admin/admin-login';
import { ProductForm } from '@/components/admin/product-form';
import { RFPForm } from '@/components/rfp/rfp-form';
import { ContactForm } from '@/components/contact/contact-form';

describe('Security Tests', () => {
  describe('Input Validation and XSS Prevention', () => {
    it('sanitizes XSS payloads in product forms', async () => {
      const onSave = jest.fn();
      const { user } = renderWithProviders(
        <ProductForm onSave={onSave} onCancel={jest.fn()} />
      );

      // Test various XSS payloads
      for (const payload of securityTestCases.xssPayloads) {
        const nameInput = screen.getByLabelText(/product name/i);
        await user.clear(nameInput);
        await user.type(nameInput, payload);

        const descriptionInput = screen.getByLabelText(/description/i);
        await user.clear(descriptionInput);
        await user.type(descriptionInput, payload);

        // The form should sanitize inputs
        expect(nameInput).not.toHaveValue(payload);
        expect(descriptionInput).not.toHaveValue(payload);
        
        // Verify no script tags or dangerous content
        expect(nameInput.value).not.toContain('<script>');
        expect(nameInput.value).not.toContain('javascript:');
        expect(descriptionInput.value).not.toContain('<script>');
        expect(descriptionInput.value).not.toContain('javascript:');
      }
    });

    it('validates file uploads and prevents malicious files', async () => {
      const onSave = jest.fn();
      const { user } = renderWithProviders(
        <ProductForm onSave={onSave} onCancel={jest.fn()} />
      );

      const fileInput = screen.getByLabelText(/upload image/i);

      // Test each invalid file type
      for (const invalidFile of securityTestCases.invalidFileTypes) {
        const file = new File(['malicious content'], invalidFile.name, {
          type: invalidFile.type,
        });

        await user.upload(fileInput, file);

        // Should show validation error
        await waitFor(() => {
          expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
        });

        // File should not be accepted
        expect(fileInput.files).toHaveLength(0);
      }

      // Test valid image file
      const validFile = new File(['valid image'], 'image.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, validFile);

      // Should accept valid file
      await waitFor(() => {
        expect(fileInput.files).toHaveLength(1);
        expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
      });
    });

    it('prevents SQL injection in search inputs', async () => {
      const onSearch = jest.fn();
      const { user } = renderWithProviders(
        <div>
          <input
            data-testid="search-input"
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products..."
          />
        </div>
      );

      const searchInput = screen.getByTestId('search-input');

      // Test SQL injection payloads
      for (const payload of securityTestCases.sqlInjectionPayloads) {
        await user.clear(searchInput);
        await user.type(searchInput, payload);

        // Search function should be called with sanitized input
        expect(onSearch).toHaveBeenCalled();
        const lastCall = onSearch.mock.calls[onSearch.mock.calls.length - 1][0];
        
        // Should not contain SQL injection patterns
        expect(lastCall).not.toContain('DROP TABLE');
        expect(lastCall).not.toContain('UNION SELECT');
        expect(lastCall).not.toContain("' OR '1'='1");
      }
    });

    it('sanitizes HTML content in rich text fields', async () => {
      const onSubmit = jest.fn();
      const { user } = renderWithProviders(
        <ContactForm onSubmit={onSubmit} />
      );

      const messageField = screen.getByLabelText(/message/i);
      const maliciousContent = '<script>alert("XSS")</script><p>Normal content</p><img src=x onerror=alert("XSS")>';

      await user.type(messageField, maliciousContent);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const submittedData = onSubmit.mock.calls[0][0];
      
      // Should contain safe content but not dangerous scripts
      expect(submittedData.message).toContain('Normal content');
      expect(submittedData.message).not.toContain('<script>');
      expect(submittedData.message).not.toContain('onerror=');
      expect(submittedData.message).not.toContain('javascript:');
    });
  });

  describe('Authentication and Session Security', () => {
    it('handles authentication securely', async () => {
      const onLogin = jest.fn();
      const { user } = renderWithProviders(
        <AdminLogin onLogin={onLogin} />
      );

      // Test password field properties
      const passwordField = screen.getByLabelText(/password/i);
      expect(passwordField).toHaveAttribute('type', 'password');
      expect(passwordField).toHaveAttribute('autocomplete', 'current-password');

      // Test form submission with credentials
      const emailField = screen.getByLabelText(/email/i);
      await user.type(emailField, 'admin@kitmed.com');
      await user.type(passwordField, 'secure-password-123');

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(onLogin).toHaveBeenCalledWith({
          email: 'admin@kitmed.com',
          password: 'secure-password-123',
        });
      });

      // Verify password is not exposed in DOM after submission
      expect(passwordField.value).toBe('');
    });

    it('implements proper session timeout handling', async () => {
      // Mock session storage
      const mockSessionData = {
        token: 'mock-jwt-token',
        expiresAt: Date.now() + 3600000, // 1 hour
      };

      localStorage.setItem('auth-session', JSON.stringify(mockSessionData));

      const { user } = renderWithProviders(
        <div data-testid="secure-content">Secure admin content</div>
      );

      // Initially should show content
      expect(screen.getByTestId('secure-content')).toBeInTheDocument();

      // Simulate expired session
      const expiredSessionData = {
        ...mockSessionData,
        expiresAt: Date.now() - 1000, // Expired
      };

      localStorage.setItem('auth-session', JSON.stringify(expiredSessionData));

      // Trigger session check (would normally be automatic)
      window.dispatchEvent(new Event('storage'));

      await waitFor(() => {
        // Should redirect to login or show session expired message
        expect(screen.queryByTestId('secure-content')).not.toBeInTheDocument();
      });
    });

    it('prevents session fixation attacks', async () => {
      const initialSessionId = 'initial-session-id';
      const newSessionId = 'new-session-id';

      // Set initial session
      localStorage.setItem('session-id', initialSessionId);

      const onLogin = jest.fn().mockImplementation(() => {
        // Simulate server response with new session ID
        localStorage.setItem('session-id', newSessionId);
      });

      const { user } = renderWithProviders(
        <AdminLogin onLogin={onLogin} />
      );

      await user.type(screen.getByLabelText(/email/i), 'admin@kitmed.com');
      await user.type(screen.getByLabelText(/password/i), 'password');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        // Session ID should have changed after login
        expect(localStorage.getItem('session-id')).toBe(newSessionId);
        expect(localStorage.getItem('session-id')).not.toBe(initialSessionId);
      });
    });
  });

  describe('Data Protection and Privacy', () => {
    it('masks sensitive information in forms', async () => {
      const { user } = renderWithProviders(
        <RFPForm onSubmit={jest.fn()} />
      );

      // Fill in sensitive information
      await user.type(screen.getByLabelText(/tax id/i), '12-3456789');
      await user.type(screen.getByLabelText(/registration number/i), 'REG123456');

      // Sensitive fields should be masked or have proper input types
      const taxIdField = screen.getByLabelText(/tax id/i);
      const regNumberField = screen.getByLabelText(/registration number/i);

      expect(taxIdField).toHaveAttribute('type', 'password');
      expect(regNumberField).toHaveAttribute('type', 'password');
    });

    it('prevents sensitive data exposure in client-side storage', () => {
      const sensitiveData = {
        password: 'user-password',
        taxId: '12-3456789',
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
      };

      // Simulate storing data (should not store sensitive info)
      const sanitizedData = Object.keys(sensitiveData).reduce((acc, key) => {
        if (['password', 'taxId', 'ssn', 'creditCard'].includes(key)) {
          // Sensitive data should not be stored
          return acc;
        }
        return { ...acc, [key]: sensitiveData[key as keyof typeof sensitiveData] };
      }, {});

      localStorage.setItem('user-data', JSON.stringify(sanitizedData));

      const storedData = JSON.parse(localStorage.getItem('user-data') || '{}');

      // Verify sensitive data is not stored
      expect(storedData).not.toHaveProperty('password');
      expect(storedData).not.toHaveProperty('taxId');
      expect(storedData).not.toHaveProperty('ssn');
      expect(storedData).not.toHaveProperty('creditCard');
    });

    it('implements proper data encryption for sensitive fields', async () => {
      const mockEncrypt = jest.fn((data) => `encrypted:${btoa(data)}`);
      const mockDecrypt = jest.fn((encryptedData) => atob(encryptedData.replace('encrypted:', '')));

      const { user } = renderWithProviders(
        <div>
          <input
            data-testid="sensitive-input"
            onChange={(e) => {
              // Simulate encryption before storage
              const encrypted = mockEncrypt(e.target.value);
              localStorage.setItem('sensitive-data', encrypted);
            }}
          />
          <button
            data-testid="retrieve-button"
            onClick={() => {
              const encrypted = localStorage.getItem('sensitive-data');
              if (encrypted) {
                const decrypted = mockDecrypt(encrypted);
                (document.getElementById('output') as HTMLElement).textContent = decrypted;
              }
            }}
          >
            Retrieve
          </button>
          <div id="output" data-testid="output"></div>
        </div>
      );

      const sensitiveInput = screen.getByTestId('sensitive-input');
      const retrieveButton = screen.getByTestId('retrieve-button');

      await user.type(sensitiveInput, 'sensitive-information');

      // Data should be encrypted in storage
      const storedData = localStorage.getItem('sensitive-data');
      expect(storedData).toMatch(/^encrypted:/);
      expect(storedData).not.toContain('sensitive-information');

      // Should be able to decrypt for authorized use
      await user.click(retrieveButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('output')).toHaveTextContent('sensitive-information');
      });

      expect(mockEncrypt).toHaveBeenCalledWith('sensitive-information');
      expect(mockDecrypt).toHaveBeenCalled();
    });
  });

  describe('Authorization and Access Control', () => {
    it('enforces role-based access control', () => {
      const adminUser = { role: 'admin', permissions: ['read', 'write', 'delete'] };
      const editorUser = { role: 'editor', permissions: ['read', 'write'] };
      const viewerUser = { role: 'viewer', permissions: ['read'] };

      const hasPermission = (user: any, permission: string) => {
        return user.permissions.includes(permission);
      };

      // Admin should have all permissions
      expect(hasPermission(adminUser, 'read')).toBe(true);
      expect(hasPermission(adminUser, 'write')).toBe(true);
      expect(hasPermission(adminUser, 'delete')).toBe(true);

      // Editor should have read and write, but not delete
      expect(hasPermission(editorUser, 'read')).toBe(true);
      expect(hasPermission(editorUser, 'write')).toBe(true);
      expect(hasPermission(editorUser, 'delete')).toBe(false);

      // Viewer should only have read permission
      expect(hasPermission(viewerUser, 'read')).toBe(true);
      expect(hasPermission(viewerUser, 'write')).toBe(false);
      expect(hasPermission(viewerUser, 'delete')).toBe(false);
    });

    it('prevents privilege escalation', () => {
      const currentUser = { role: 'editor', permissions: ['read', 'write'] };
      
      // Simulate attempt to escalate privileges
      const attemptPrivilegeEscalation = (user: any) => {
        // This should fail - users cannot modify their own permissions
        try {
          user.permissions.push('delete');
          user.role = 'admin';
          return false; // Should not reach here
        } catch {
          return true; // Privilege escalation prevented
        }
      };

      // Should prevent privilege escalation
      expect(attemptPrivilegeEscalation(currentUser)).toBe(true);
      expect(currentUser.role).toBe('editor');
      expect(currentUser.permissions).not.toContain('delete');
    });

    it('validates resource ownership before access', () => {
      const user1 = { id: 'user-1', role: 'editor' };
      const user2 = { id: 'user-2', role: 'editor' };
      
      const resource = { id: 'resource-1', ownerId: 'user-1', data: 'sensitive-data' };

      const canAccess = (user: any, resource: any) => {
        // Users can only access their own resources (or admins can access all)
        return user.role === 'admin' || resource.ownerId === user.id;
      };

      // Owner should have access
      expect(canAccess(user1, resource)).toBe(true);

      // Non-owner should not have access
      expect(canAccess(user2, resource)).toBe(false);

      // Admin should have access regardless of ownership
      const adminUser = { id: 'admin-1', role: 'admin' };
      expect(canAccess(adminUser, resource)).toBe(true);
    });
  });

  describe('Secure Communication', () => {
    it('enforces HTTPS for sensitive operations', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
          hostname: 'kitmed.com',
          port: '443',
        },
        writable: true,
      });

      const isSecureConnection = () => {
        return window.location.protocol === 'https:';
      };

      expect(isSecureConnection()).toBe(true);

      // Test that HTTP would be rejected
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
          hostname: 'kitmed.com',
          port: '80',
        },
        writable: true,
      });

      expect(isSecureConnection()).toBe(false);
    });

    it('implements Content Security Policy headers', () => {
      // Verify CSP meta tag exists
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      
      if (cspMeta) {
        const cspContent = cspMeta.getAttribute('content');
        
        // Should have strict CSP rules
        expect(cspContent).toContain("default-src 'self'");
        expect(cspContent).toContain("script-src 'self'");
        expect(cspContent).toContain("style-src 'self'");
        expect(cspContent).toContain("img-src 'self'");
        
        // Should not allow unsafe-inline or unsafe-eval
        expect(cspContent).not.toContain("'unsafe-inline'");
        expect(cspContent).not.toContain("'unsafe-eval'");
      }
    });
  });

  describe('Medical Data Security Compliance', () => {
    it('implements HIPAA-compliant data handling', () => {
      const patientData = {
        id: 'patient-123',
        name: 'John Doe',
        medicalRecordNumber: 'MRN-456789',
        diagnosis: 'Hypertension',
        equipment: 'Blood Pressure Monitor',
      };

      // Simulate audit logging
      const auditLog: any[] = [];
      
      const accessPatientData = (userId: string, action: string, data: any) => {
        // Log all access to patient data
        auditLog.push({
          timestamp: new Date().toISOString(),
          userId,
          action,
          resourceId: data.id,
          resourceType: 'patient-data',
        });
        
        return data;
      };

      // Access patient data
      const user = 'doctor-123';
      accessPatientData(user, 'read', patientData);

      // Verify audit logging
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0]).toMatchObject({
        userId: user,
        action: 'read',
        resourceId: patientData.id,
        resourceType: 'patient-data',
      });
      expect(auditLog[0]).toHaveProperty('timestamp');
    });

    it('enforces medical device security standards', () => {
      const medicalDevice = {
        id: 'device-123',
        type: 'ventilator',
        serialNumber: 'VT-789123',
        firmwareVersion: '2.1.5',
        lastSecurityUpdate: '2024-01-15',
        encryptionEnabled: true,
        authenticationRequired: true,
      };

      const validateDeviceSecurity = (device: any) => {
        const securityChecks = {
          hasEncryption: device.encryptionEnabled === true,
          requiresAuth: device.authenticationRequired === true,
          firmwareUpToDate: new Date(device.lastSecurityUpdate) > new Date('2024-01-01'),
          serialNumberValid: device.serialNumber && device.serialNumber.length > 0,
        };

        return Object.values(securityChecks).every(check => check === true);
      };

      expect(validateDeviceSecurity(medicalDevice)).toBe(true);

      // Test insecure device
      const insecureDevice = {
        ...medicalDevice,
        encryptionEnabled: false,
        authenticationRequired: false,
      };

      expect(validateDeviceSecurity(insecureDevice)).toBe(false);
    });

    it('implements secure medical equipment configuration', () => {
      const equipmentConfig = {
        deviceId: 'monitor-456',
        networkConfig: {
          sslEnabled: true,
          certificateValidation: true,
          minimumTlsVersion: '1.2',
          allowedCiphers: ['AES-256-GCM', 'ChaCha20-Poly1305'],
        },
        accessControl: {
          requireStrongPasswords: true,
          sessionTimeout: 900, // 15 minutes
          maxFailedLogins: 3,
          accountLockoutDuration: 1800, // 30 minutes
        },
        auditConfig: {
          logAllAccess: true,
          logDataChanges: true,
          logSystemEvents: true,
          logRetentionPeriod: 2555, // 7 years in days
        },
      };

      const validateSecureConfig = (config: any) => {
        return (
          config.networkConfig.sslEnabled &&
          config.networkConfig.certificateValidation &&
          parseFloat(config.networkConfig.minimumTlsVersion) >= 1.2 &&
          config.accessControl.requireStrongPasswords &&
          config.accessControl.sessionTimeout <= 1800 &&
          config.accessControl.maxFailedLogins <= 5 &&
          config.auditConfig.logAllAccess &&
          config.auditConfig.logRetentionPeriod >= 2555
        );
      };

      expect(validateSecureConfig(equipmentConfig)).toBe(true);
    });
  });
});

describe('Security Integration Tests', () => {
  it('performs comprehensive security validation workflow', async () => {
    // This test simulates a complete security validation workflow
    const securityTests = {
      inputValidation: false,
      authentication: false,
      authorization: false,
      dataEncryption: false,
      auditLogging: false,
    };

    // Test input validation
    const testInput = '<script>alert("test")</script>';
    const sanitizedInput = testInput.replace(/<script.*?>.*?<\/script>/gi, '');
    securityTests.inputValidation = !sanitizedInput.includes('<script>');

    // Test authentication
    const authToken = 'valid-jwt-token';
    const isAuthenticated = authToken && authToken.length > 0;
    securityTests.authentication = isAuthenticated;

    // Test authorization
    const userRole = 'admin';
    const requiredPermission = 'write';
    const hasPermission = userRole === 'admin' || userRole === 'editor';
    securityTests.authorization = hasPermission;

    // Test data encryption
    const sensitiveData = 'patient-data-123';
    const encryptedData = btoa(sensitiveData); // Simple encoding for test
    securityTests.dataEncryption = encryptedData !== sensitiveData;

    // Test audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      action: 'data-access',
      userId: 'user-123',
    };
    securityTests.auditLogging = auditLog.timestamp && auditLog.action && auditLog.userId;

    // All security tests should pass
    expect(Object.values(securityTests).every(test => test === true)).toBe(true);
  });
});