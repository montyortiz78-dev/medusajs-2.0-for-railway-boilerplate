import { Button, Heading } from "@medusajs/ui"

const Hero = () => {
  return (
    <div className="h-[85vh] w-full border-b border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-8 p-4">
        
        <div className="glass p-8 md:p-12 rounded-3xl max-w-3xl w-full animate-float flex flex-col items-center gap-6">
          <Heading
            level="h1"
            className="text-5xl md:text-7xl leading-tight font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-kandi-pink via-kandi-yellow to-kandi-blue drop-shadow-sm"
          >
            PLUR & PLAY
          </Heading>
          
          <Heading
            level="h2"
            className="text-xl md:text-2xl leading-relaxed text-ui-fg-subtle font-medium max-w-lg"
          >
            The ultimate collection of Kandi bracelets, charms, and DIY kits for your next rave.
          </Heading>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <a
              href="/store"
              className="group relative px-8 py-3 bg-kandi-pink text-white font-bold rounded-full hover:bg-kandi-purple transition-all duration-300 shadow-[0_0_15px_rgba(255,0,204,0.5)] hover:shadow-[0_0_25px_rgba(176,38,255,0.6)]"
            >
              Shop Collection
            </a>
            <a
              href="/custom"
              className="px-8 py-3 border-2 border-kandi-green text-kandi-green font-bold rounded-full hover:bg-kandi-green hover:text-black transition-all duration-300"
            >
              Customize Your Own
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Hero