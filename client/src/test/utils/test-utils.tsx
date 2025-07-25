// Shared test utilities and custom render functions
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'

// Create a custom render function that includes providers
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialClub?: any
  initialUser?: any
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg',
  ...overrides,
})

export const createMockClub = (overrides = {}) => ({
  id: 1,
  name: 'Test FC',
  description: 'A test football club',
  address: 'Test Street 1',
  phone: '+49 123 456789',
  email: 'info@testfc.com',
  website: 'https://testfc.com',
  foundedYear: 1950,
  colors: 'Blue and White',
  logo: 'https://testfc.com/logo.png',
  ...overrides,
})

export const createMockMember = (overrides = {}) => ({
  id: 1,
  clubId: 1,
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max@example.com',
  phone: '+49 123 456789',
  birthDate: '1990-01-01',
  address: 'Musterstraße 1',
  membershipNumber: 'M2025001',
  status: 'active' as const,
  joinDate: '2025-01-01',
  notes: 'Test member',
  ...overrides,
})

export const createMockTeam = (overrides = {}) => ({
  id: 1,
  clubId: 1,
  name: 'Herren 1',
  category: 'senior',
  ageGroup: 'U21',
  coach: 'Trainer Schmidt',
  league: 'Kreisliga A',
  season: '2024/25',
  ...overrides,
})

export const createMockBooking = (overrides = {}) => ({
  id: 1,
  clubId: 1,
  facilityId: 1,
  teamId: 1,
  title: 'Training Herren 1',
  type: 'training' as const,
  date: '2025-01-15',
  startTime: '18:00',
  endTime: '20:00',
  recurring: false,
  recurringType: null,
  recurringUntil: null,
  notes: 'Test booking',
  ...overrides,
})

// API mock helpers
export const mockApiResponse = (data: any, options: { status?: number; ok?: boolean } = {}) => {
  const { status = 200, ok = true } = options
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

export const mockApiError = (message: string, status: number = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({
      error: {
        type: 'ApiError',
        message,
        timestamp: new Date().toISOString(),
        requestId: 'test-request-id',
      },
    }),
  } as Response)
}

// Custom matchers for better test assertions
export const expectToHaveLoadingState = (element: HTMLElement) => {
  expect(element).toHaveAttribute('aria-busy', 'true')
}

export const expectToHaveErrorState = (element: HTMLElement) => {
  expect(element).toHaveAttribute('aria-invalid', 'true')
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { renderWithProviders as render }