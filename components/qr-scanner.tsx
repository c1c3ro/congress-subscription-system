"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw } from "lucide-react"

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [isInitializing, setIsInitializing] = useState(true)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerIdRef = useRef(`qr-reader-${Date.now()}`)
  const hasScannedRef = useRef(false)
  const isMountedRef = useRef(true)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop()
        }
      } catch (err) {
        // Ignorar erros ao parar
      }
      scannerRef.current = null
    }
  }, [])

  const startScanner = useCallback(async () => {
    if (!isMountedRef.current) return

    setIsInitializing(true)
    setError("")
    hasScannedRef.current = false

    // Garantir que o scanner anterior foi parado
    await stopScanner()

    // Aguardar um pouco para o DOM atualizar
    await new Promise(resolve => setTimeout(resolve, 100))

    const containerId = containerIdRef.current
    const container = document.getElementById(containerId)
    
    if (!container || !isMountedRef.current) {
      setIsInitializing(false)
      return
    }

    // Limpar o conteúdo do container
    container.innerHTML = ""

    try {
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (hasScannedRef.current || !isMountedRef.current) return
          
          hasScannedRef.current = true
          console.log("[v0] QR Code detectado:", decodedText)

          // Parar o scanner primeiro
          try {
            await scanner.stop()
          } catch (e) {
            // Ignorar erro ao parar
          }
          
          if (isMountedRef.current) {
            setIsScanning(false)
            onScanSuccess(decodedText)
          }
        },
        () => {
          // Ignorar erros de scan contínuo (normal quando não há QR code visível)
        }
      )

      if (isMountedRef.current) {
        setIsScanning(true)
        setIsInitializing(false)
      }
    } catch (err) {
      console.error("[v0] Error starting scanner:", err)
      if (isMountedRef.current) {
        setError("Erro ao acessar a câmera. Verifique as permissões do navegador.")
        setIsScanning(false)
        setIsInitializing(false)
      }
    }
  }, [onScanSuccess, stopScanner])

  useEffect(() => {
    isMountedRef.current = true
    
    // Iniciar scanner após um pequeno delay para garantir que o DOM está pronto
    const timer = setTimeout(() => {
      startScanner()
    }, 200)

    return () => {
      isMountedRef.current = false
      clearTimeout(timer)
      stopScanner()
    }
  }, [startScanner, stopScanner])

  const handleRetry = () => {
    startScanner()
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-4">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Camera className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">Escaneie o QR Code do Inscrito</h2>
        <p className="text-sm text-muted-foreground">Posicione o QR code dentro da área de leitura</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-4 text-sm">
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={handleRetry}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      )}

      {isInitializing && !error && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          Iniciando câmera...
        </div>
      )}

      <div 
        id={containerIdRef.current} 
        className="rounded-lg overflow-hidden border-2 border-primary/20 [&>video]:!w-full [&>video]:!max-w-full"
        style={{ 
          minHeight: isScanning ? "300px" : "0px",
          display: isInitializing && !error ? "none" : "block"
        }} 
      />

      {isScanning && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Câmera ativa - aguardando QR code...
        </p>
      )}
    </Card>
  )
}
