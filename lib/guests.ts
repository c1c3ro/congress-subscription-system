// Tipos para o sistema
export interface Guest {
  id: string
  name: string
  companion?: string
}

export interface Confirmation {
  guestId: string
  confirmed: boolean
  timestamp: string
}

// Lista de convidados - EDITE AQUI para adicionar seus convidados
export const guestsList: Guest[] = [
  { id: "maria-silva", name: "Maria Silva" },
  { id: "joao-santos", name: "João Santos" },
  { id: "ana-costa", name: "Ana Costa" },
  { id: "pedro-oliveira", name: "Pedro Oliveira" },
  { id: "julia-souza", name: "Júlia Souza" },
]

export function getGuests(): Guest[] {
  return guestsList
}

export function getGuestById(id: string): Guest | undefined {
  return guestsList.find((guest) => guest.id === id)
}

// Senha para o painel admin
export const ADMIN_PASSWORD = "test1234"
