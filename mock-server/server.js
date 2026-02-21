/**
 * Mock API Server — Loan Applications
 *
 * Simulates the full Loan Applications API contract so the test suite can run
 * in CI without a real backend. Implements the same business rules the tests assert:
 *   - OAuth 2.0 client-credentials token issuance
 *   - Affordability check (income vs requested amount)
 *   - Boundary validation (min/max loan amounts per product)
 *   - Mandatory field validation
 *   - In-memory CRUD for loan applications
 */

const express = require('express');
const { randomUUID } = require('crypto');

const app = express();
app.use(express.json());

// In-memory store
const applications = new Map();

// Helpers
function makeToken() {
  const b64 = (s) => Buffer.from(s).toString('base64url');
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64(JSON.stringify({ sub: 'test-client', exp: Math.floor(Date.now() / 1000) + 3600 }));
  const sig = b64('mock-sig-' + randomUUID());
  return `${header}.${payload}.${sig}`;
}

function makeReferenceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `LN-${date}-${suffix}`;
}

function requireAuth(req, res) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing or invalid Bearer token', traceId: randomUUID(), timestamp: new Date().toISOString() });
    return false;
  }
  return true;
}

function apiError(code, message, details) {
  return { code, message, ...(details ? { details } : {}), traceId: randomUUID(), timestamp: new Date().toISOString() };
}

const PRODUCT_LIMITS = {
  HOME_LOAN:     { min: 1000, max: 3_000_000 },
  PERSONAL_LOAN: { min: 1000, max: 50_000 },
  AUTO_LOAN:     { min: 1000, max: 150_000 },
  BUSINESS_LOAN: { min: 1000, max: 500_000 },
};

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'UP', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req, res) => {
  res.json({ status: 'UP', checks: { database: { status: 'UP' }, messageQueue: { status: 'UP' }, decisionEngine: { status: 'UP' } } });
});

// OAuth token
app.post('/oauth/token', (req, res) => {
  const { clientId, clientSecret, grantType } = req.body ?? {};
  if (!clientId || !clientSecret || grantType !== 'client_credentials') {
    return res.status(400).json(apiError('INVALID_REQUEST', 'clientId, clientSecret and grantType=client_credentials are required'));
  }
  res.json({ accessToken: makeToken(), tokenType: 'Bearer', expiresIn: 3600, scope: 'loans:read loans:write' });
});

// POST /v1/loans
app.post('/v1/loans', (req, res) => {
  if (!requireAuth(req, res)) return;
  const body = req.body ?? {};
  const errors = {};

  if (!body.product)            errors.product = ['product is required'];
  if (!body.requestedAmount)    errors.requestedAmount = ['requestedAmount is required'];
  if (!body.termMonths)         errors.termMonths = ['termMonths is required'];
  if (!body.repaymentFrequency) errors.repaymentFrequency = ['repaymentFrequency is required'];

  const a = body.applicant ?? {};
  if (!a.email)            errors['applicant.email'] = ['email is required'];
  if (!a.firstName)        errors['applicant.firstName'] = ['firstName is required'];
  if (!a.lastName)         errors['applicant.lastName'] = ['lastName is required'];
  if (!a.dateOfBirth)      errors['applicant.dateOfBirth'] = ['dateOfBirth is required'];
  if (!a.annualIncome)     errors['applicant.annualIncome'] = ['annualIncome is required'];
  if (!a.employmentStatus) errors['applicant.employmentStatus'] = ['employmentStatus is required'];

  if (Object.keys(errors).length) {
    return res.status(400).json(apiError('VALIDATION_ERROR', 'One or more required fields are missing', errors));
  }

  if (!PRODUCT_LIMITS[body.product]) {
    return res.status(400).json(apiError('VALIDATION_ERROR', 'Invalid product type', { product: ['invalid value'] }));
  }

  const limits = PRODUCT_LIMITS[body.product];
  if (body.requestedAmount < limits.min) {
    return res.status(422).json(apiError('VALIDATION_ERROR', `requestedAmount must be at least ${limits.min}`, { requestedAmount: [`minimum is ${limits.min}`] }));
  }
  if (body.requestedAmount > limits.max) {
    return res.status(422).json(apiError('VALIDATION_ERROR', `requestedAmount exceeds product maximum of ${limits.max}`, { requestedAmount: [`maximum for ${body.product} is ${limits.max}`] }));
  }

  // Affordability: debt-to-income > 9x annual income
  if (body.requestedAmount / (a.annualIncome || 1) > 9) {
    return res.status(422).json(apiError('AFFORDABILITY_CHECK_FAILED', 'Requested amount exceeds affordability threshold based on declared income'));
  }

  const now = new Date().toISOString();
  const applicationId = randomUUID();
  const application = {
    applicationId,
    referenceNumber: makeReferenceNumber(),
    product: body.product,
    status: 'DRAFT',
    requestedAmount: body.requestedAmount,
    termMonths: body.termMonths,
    repaymentFrequency: body.repaymentFrequency,
    purpose: body.purpose ?? '',
    applicant: body.applicant,
    createdAt: now,
    updatedAt: now,
    _links: { self: { href: `/v1/loans/${applicationId}` }, decision: { href: `/v1/loans/${applicationId}/decision` } },
  };

  applications.set(applicationId, application);
  res.status(201).set('Location', `/v1/loans/${applicationId}`).json(application);
});

// GET /v1/loans
app.get('/v1/loans', (req, res) => {
  if (!requireAuth(req, res)) return;
  let list = Array.from(applications.values());
  if (req.query.status)  list = list.filter(a => a.status === req.query.status);
  if (req.query.product) list = list.filter(a => a.product === req.query.product);

  const page = parseInt(req.query.page ?? '1', 10);
  const pageSize = parseInt(req.query.pageSize ?? '20', 10);
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const data = list.slice((page - 1) * pageSize, page * pageSize);

  res.json({
    data,
    pagination: { page, pageSize, totalCount: total, totalPages },
    _links: {
      self: { href: `/v1/loans?page=${page}&pageSize=${pageSize}` },
      ...(page < totalPages ? { next: { href: `/v1/loans?page=${page + 1}&pageSize=${pageSize}` } } : {}),
      ...(page > 1          ? { prev: { href: `/v1/loans?page=${page - 1}&pageSize=${pageSize}` } } : {}),
    },
  });
});

// GET /v1/loans/:id
app.get('/v1/loans/:id', (req, res) => {
  if (!requireAuth(req, res)) return;
  const app = applications.get(req.params.id);
  if (!app) return res.status(404).json(apiError('APPLICATION_NOT_FOUND', `No application found with id ${req.params.id}`));
  res.json(app);
});

// PATCH /v1/loans/:id
app.patch('/v1/loans/:id', (req, res) => {
  if (!requireAuth(req, res)) return;
  const existing = applications.get(req.params.id);
  if (!existing) return res.status(404).json(apiError('APPLICATION_NOT_FOUND', `No application found with id ${req.params.id}`));

  const allowed = ['requestedAmount', 'termMonths', 'repaymentFrequency'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  applications.set(req.params.id, updated);
  res.json(updated);
});

// DELETE /v1/loans/:id
app.delete('/v1/loans/:id', (req, res) => {
  if (!requireAuth(req, res)) return;
  if (!applications.has(req.params.id)) {
    return res.status(404).json(apiError('APPLICATION_NOT_FOUND', `No application found with id ${req.params.id}`));
  }
  applications.delete(req.params.id);
  res.status(204).send();
});

// GET /v1/loans/:id/decision
app.get('/v1/loans/:id/decision', (req, res) => {
  if (!requireAuth(req, res)) return;
  const application = applications.get(req.params.id);
  if (!application) return res.status(404).json(apiError('APPLICATION_NOT_FOUND', `No application found with id ${req.params.id}`));

  res.json({
    applicationId: application.applicationId,
    status: 'APPROVED',
    approvedAmount: application.requestedAmount,
    interestRate: 6.49,
    comparisonRate: 6.71,
    monthlyRepayment: Math.round(application.requestedAmount * 0.005 * 100) / 100,
    decidedAt: new Date().toISOString(),
  });
});

const PORT = process.env.MOCK_PORT || 3000;
app.listen(PORT, () => console.log(`[mock-server] Loan API mock running on http://localhost:${PORT}`));
