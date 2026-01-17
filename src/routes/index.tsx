import {createFileRoute, Link} from '@tanstack/react-router'
import {ArrowRight, MapPin} from "lucide-react";

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    return <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
            <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-background to-background"/>

            <div className="mb-6 h-24 w-24 overflow-hidden rounded-full bg-linear-to-br from-primary to-primary/60 shadow-lg">
                <img src="/me.jpg" alt="Karel Štefan" className="h-full w-full object-cover"/>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Karel Štefan
            </h1>

            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Developer & Outdoor Enthusiast
            </p>
        </section>

        {/* Projects Section */}
        <section className="mx-auto max-w-4xl px-6 py-16">
            <h2 className="mb-8 font-display text-2xl font-semibold text-foreground">
                Projects
            </h2>

            <div className="grid gap-6">
                <Link
                    to="/gpx-merger"
                    className="group flex items-center justify-between rounded-2xl border border-border/50 bg-card p-6 shadow-soft transition-all hover:border-primary/30 hover:shadow-md"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/60">
                            <MapPin className="h-6 w-6 text-primary-foreground"/>
                        </div>
                        <div>
                            <h3 className="font-display text-lg font-semibold text-foreground">
                                GPX Merger
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Combine multiple GPX files and visualize elevation profiles
                            </p>
                        </div>
                    </div>
                    <ArrowRight
                        className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"/>
                </Link>
            </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Karel Štefan</p>
        </footer>
    </div>


}
