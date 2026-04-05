import { Navbar } from "../components/Navbar";
import { HeroSection } from "../components/HeroSection";
import { ArticlesSection } from "../components/ArticleSection";
import { AlertSection } from "../components/AlertSection";

export function Home() {
	return (
		<div className="min-h-screen">
			<Navbar />
			<HeroSection />
			<ArticlesSection />
			<AlertSection />
		</div>
	);
}
