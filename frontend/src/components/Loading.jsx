
const LoadingPage = () => {
  return (
      <div className="flex h-full items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b rounded-full" />
          <p className="mt-4 text-gray-600">Loading</p>
        </div>
      </div>
  )
}

export default LoadingPage;
