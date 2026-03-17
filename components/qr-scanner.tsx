"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Card } from "@/components/ui/card"
import { Camera } from "lucide-react"

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState("")
  const isRunningRef = useRef(false)
  const isMountedRef = useRef(true)
  const hasScannedRef = useRef(false)
  const isInitializingRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    hasScannedRef.current = false
    isInitializingRef.current = false

    const startScanner = async () => {
      if (isInitializingRef.current) return
      isInitializingRef.current = true

      try {
        // Limpar scanner anterior se existir
        if (scannerRef.current && isRunningRef.current) {
          try {
            const state = await scannerRef.current.getState()
            if (state === 2 || state === 3) {
              await scannerRef.current.stop()
            }
          } catch (e) {
            console.error("Error stopping previous scanner:", e)
          }
        }

        // Remove elemento anterior se existir
        const existingReader = document.getElementById("qr-reader")
        if (existingReader) {
          existingReader.innerHTML = ""
        }

        const scanner = new Html5Qrcode("qr-reader")
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (hasScannedRef.current) {
              return
            }

            hasScannedRef.current = true
            console.log("QR Code detectado:", decodedText)

            // Para o scanner e executa o callback
            if (scanner && isRunningRef.current) {
              scanner.stop().then(() => {
                if (isMountedRef.current) {
                  setIsScanning(false)
                  onScanSuccess(decodedText)
                }
              }).catch((err) => {
                console.error("Error stopping scanner:", err)
                if (isMountedRef.current) {
                  onScanSuccess(decodedText)
                }
              })
            }
          },
          (errorMessage) => {
            // Ignorar erros de scan contínuo
          },
        )

        isRunningRef.current = true
        if (isMountedRef.current) {
          setIsScanning(true)
          setError("")
        }
      } catch (err) {
        console.error("Error starting scanner:", err)
        if (isMountedRef.current) {
          setError("Erro ao acessar a câmera. Verifique as permissões.")
          setIsScanning(false)
        }
      } finally {
        isInitializingRef.current = false
      }
    }

    startScanner()

    return () => {
      isMountedRef.current = false
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch((err) => {
          console.error("Error cleaning up scanner:", err)
        })
      }
    }
  }, [onScanSuccess])

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

      {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div id="qr-reader" className="rounded-lg overflow-hidden border-2 border-primary/20" style={{ minHeight: "300px" }} />

      {isScanning && (
        <p className="text-center text-sm text-muted-foreground mt-4">Câmera ativa - aguardando QR code...</p>
      )}
    </Card>
  )
}
