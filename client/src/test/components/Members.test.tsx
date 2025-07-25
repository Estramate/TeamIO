// Unit tests for Members component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Members from '@/pages/members'
import { useAuth } from '@/hooks/useAuth'
import { useClub } from '@/hooks/use-club'

// Mock the hooks
vi.mock('@/hooks/useAuth')
vi.mock('@/hooks/use-club')
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}))

const mockUseAuth = vi.mocked(useAuth)
const mockUseClub = vi.mocked(useClub)

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Members Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', name: 'Test User' }
    })

    mockUseClub.mockReturnValue({
      selectedClub: { id: 1, name: 'Test Club' },
      setSelectedClub: vi.fn()
    })

    // Mock fetch for API calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            firstName: 'Max',
            lastName: 'Mustermann',
            email: 'max@example.com',
            status: 'active'
          }
        ]),
      })
    ) as any
  })

  it('renders members list', async () => {
    renderWithProviders(<Members />)
    
    expect(screen.getByText('Mitglieder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mitglieder suchen...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument()
    })
  })

  it('allows searching members', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Members />)
    
    const searchInput = screen.getByPlaceholderText('Mitglieder suchen...')
    await user.type(searchInput, 'Max')
    
    expect(searchInput).toHaveValue('Max')
  })

  it('opens member creation dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Members />)
    
    const addButton = screen.getByText('Mitglied hinzufügen')
    await user.click(addButton)
    
    expect(screen.getByText('Neues Mitglied')).toBeInTheDocument()
    expect(screen.getByLabelText('Vorname *')).toBeInTheDocument()
    expect(screen.getByLabelText('Nachname *')).toBeInTheDocument()
  })

  it('validates required fields in member form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Members />)
    
    // Open dialog
    await user.click(screen.getByText('Mitglied hinzufügen'))
    
    // Try to submit without filling required fields
    const submitButton = screen.getByText('Mitglied erstellen')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Vorname ist erforderlich')).toBeInTheDocument()
      expect(screen.getByText('Nachname ist erforderlich')).toBeInTheDocument()
    })
  })

  it('switches between grid and list view', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Members />)
    
    // Default should be grid view
    expect(screen.getByLabelText('Grid-Ansicht')).toBeInTheDocument()
    
    // Switch to list view
    const listViewButton = screen.getByLabelText('Listen-Ansicht')
    await user.click(listViewButton)
    
    // Should show list view (test by checking for specific list styling)
    expect(listViewButton).toHaveClass('bg-accent')
  })

  it('handles unauthorized access', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null
    })

    renderWithProviders(<Members />)
    
    // Should show loading or redirect (depending on implementation)
    // This will depend on how your auth redirect hook works
  })
})