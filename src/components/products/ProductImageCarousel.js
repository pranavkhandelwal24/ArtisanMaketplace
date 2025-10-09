"use client"

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProductImageCarousel({ media }) {
  const [emblaRef, emblaApi] = useEmblaCarousel()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [thumbIndexes, setThumbIndexes] = useState([])

  const onThumbClick = useCallback((index) => {
    if (!emblaApi) return
    emblaApi.scrollTo(index)
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi, setSelectedIndex])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])


  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {media.map((item, index) => (
            <div className="relative flex-[0_0_100%] aspect-square" key={index}>
              {item.type === 'video' ? (
                 <video
                    controls
                    src={item.url}
                    className="h-full w-full object-cover rounded-lg border shadow-sm"
                 />
              ) : (
                <Image
                  src={item.url || "https://placehold.co/600x600"}
                  alt={`Product image ${index + 1}`}
                  width={600}
                  height={600}
                  className="h-full w-full object-cover rounded-lg border shadow-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>
      
       {media.length > 1 && (
        <>
            <Button
                onClick={scrollPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                variant="outline"
                size="icon"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
                onClick={scrollNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                variant="outline"
                size="icon"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </>
      )}


      {/* Thumbnails */}
      <div className="mt-4">
        <div className="grid grid-cols-5 gap-2">
            {media.map((item, index) => (
                <button onClick={() => onThumbClick(index)} className={cn(
                    "relative aspect-square rounded-md overflow-hidden transition-opacity",
                    index === selectedIndex ? 'opacity-100 ring-2 ring-primary' : 'opacity-50 hover:opacity-100'
                )} key={index}>
                    {item.type === 'video' ? (
                        <div className="absolute inset-0 bg-black flex items-center justify-center">
                            <Video className="h-6 w-6 text-white" />
                        </div>
                    ) : (
                        <Image
                            src={item.url}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                    )}
                </button>
            ))}
        </div>
      </div>
    </div>
  )
}
