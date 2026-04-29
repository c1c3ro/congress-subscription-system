import LoginForm from "./login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>
}) {
  const params = (await searchParams) || {}
  const nextPath = typeof params.next === "string" && params.next.length > 0 ? params.next : "/"
  return <LoginForm nextPath={nextPath} />
}

