import React, { useState, useRef, useCallback } from "react";
import {
	UploadCloud,
	X,
	CheckCircle2,
	AlertTriangle,
	Eye,
	TreePine,
	AlertCircle,
	Search,
	RefreshCw,
	Camera,
	Zap,
	MapPin,
	Clock,
	ScanLine,
	Image as ImageIcon,
	WifiOff,
} from "lucide-react";

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
	Wildlife: {
		badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
		bar: "bg-emerald-500",
		tabActive: "bg-emerald-50 text-emerald-700 border-emerald-400",
		icon: TreePine,
	},
	Trap: {
		badge: "bg-red-100 text-red-700 border border-red-200",
		bar: "bg-red-500",
		tabActive: "bg-red-50 text-red-700 border-red-400",
		icon: AlertTriangle,
	},
	Forest: {
		badge: "bg-green-100 text-green-700 border border-green-200",
		bar: "bg-green-500",
		tabActive: "bg-green-50 text-green-700 border-green-400",
		icon: AlertCircle,
	},
	Suspicious: {
		badge: "bg-amber-100 text-amber-700 border border-amber-200",
		bar: "bg-amber-400",
		tabActive: "bg-amber-50 text-amber-700 border-amber-400",
		icon: AlertCircle,
	},
};

const PRIORITY_RING = {
	critical: "bg-red-500",
	high: "bg-orange-400",
	medium: "bg-amber-400",
	low: "bg-gray-300",
};

const ANALYSIS_STEPS = [
	"Uploading images to server",
	"Extracting visual features",
	"Running AI classification model",
	"Filtering important results",
];

// ─── Constants ────────────────────────────────────────────────────────────────
const SUSPICIOUS_THRESHOLD = 75;
const AI_API_URL = "http://localhost:3000/predict";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nowTimestamp() {
	const d = new Date();
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function mapApiResult(apiItem, fileEntry, uiIndex) {
	const confidenceNum = parseFloat(apiItem.confidence);
	const timestamp = nowTimestamp();

	const classLabels = ["Forest", "Trap", "Wildlife"];
	const breakdown = apiItem.raw_prediction
		? classLabels
				.map(
					(name, i) =>
						`${name}: ${(apiItem.raw_prediction[i] * 100).toFixed(1)}%`,
				)
				.join(" · ")
		: null;
	const breakdownSuffix = breakdown ? ` [Scores — ${breakdown}]` : "";

	const isLowConfidence =
		apiItem.low_confidence || confidenceNum < SUSPICIOUS_THRESHOLD;

	let category, label, priority, details;

	if (isLowConfidence) {
		category = "Suspicious";
		label = "Low Confidence Detection";
		priority = "medium";
		details = `Uncertain classification with only ${apiItem.confidence} confidence. The image content may not match any known category — manual inspection by a senior ranger is strongly recommended.${breakdownSuffix}`;
	} else if (apiItem.result === "Trap") {
		category = "Trap";
		label = "Trap Detected";
		priority = "critical";
		details = `A trap was detected with high confidence (${apiItem.confidence}). Immediate removal is required. GPS coordinates should be logged for evidence documentation and follow-up patrol.${breakdownSuffix}`;
	} else if (apiItem.result === "Forest") {
		category = "Forest";
		label = "Forest Detected";
		priority = "low";
		details = `Forest area detected with ${apiItem.confidence} confidence. No wildlife or traps are present.${breakdownSuffix}`;
	} else {
		category = "Wildlife";
		label = "Wildlife Detected";
		priority = confidenceNum >= 90 ? "high" : "medium";
		details = `Wildlife activity detected with ${apiItem.confidence} confidence. Rangers are advised to monitor the area carefully and avoid disturbing the animals.${breakdownSuffix}`;
	}

	return {
		id: uiIndex + 1,
		filename: apiItem.filename,
		category,
		label,
		confidence: confidenceNum,
		preview: fileEntry
			? fileEntry.preview
			: `https://picsum.photos/seed/img${uiIndex}/600/400`,
		timestamp,
		location: "Unknown",
		priority,
		details,
	};
}

// ─── ImageCard ────────────────────────────────────────────────────────────────
function ImageCard({ item, onView }) {
	const cfg = CATEGORY_CONFIG[item.category];
	const Icon = cfg.icon;

	return (
		<article
			className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
                 hover:shadow-md transition-all duration-200 cursor-pointer group"
			onClick={() => onView(item)}
		>
			<div className="relative aspect-video overflow-hidden bg-gray-100">
				<img
					src={item.preview}
					alt={item.label}
					className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					onError={(e) => {
						e.target.src = `https://picsum.photos/seed/${item.id}x/600/400`;
					}}
				/>
				<div
					className={`absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${PRIORITY_RING[item.priority]}`}
				/>
				<div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
					<div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow">
						<Eye size={13} /> View Details
					</div>
				</div>
			</div>

			<div className="p-4">
				<div className="flex items-center justify-between mb-2.5">
					<span
						className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
					>
						<Icon size={11} />
						{item.category}
					</span>
					<span className="text-[10px] text-gray-400 font-mono truncate max-w-[110px]">
						{item.filename}
					</span>
				</div>

				<h3 className="text-sm font-bold text-gray-900 mb-3 leading-tight">
					{item.label}
				</h3>

				<div className="mb-3">
					<div className="flex justify-between text-xs text-gray-500 mb-1">
						<span>Confidence</span>
						<span className="font-semibold text-gray-700">
							{item.confidence}%
						</span>
					</div>
					<div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
						<div
							className={`h-full rounded-full ${cfg.bar} transition-all duration-700`}
							style={{ width: `${item.confidence}%` }}
						/>
					</div>
				</div>

				<div className="space-y-1">
					<div className="flex items-center gap-1.5 text-xs text-gray-400">
						<MapPin size={11} className="flex-shrink-0" />
						<span>{item.location}</span>
					</div>
					<div className="flex items-center gap-1.5 text-xs text-gray-400">
						<Clock size={11} className="flex-shrink-0" />
						<span>{item.timestamp}</span>
					</div>
				</div>
			</div>
		</article>
	);
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ item, onClose }) {
	if (!item) return null;
	const cfg = CATEGORY_CONFIG[item.category];
	const Icon = cfg.icon;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeInScale_0.2s_ease-out]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="relative">
					<img
						src={item.preview}
						alt={item.label}
						className="w-full h-60 object-cover"
						onError={(e) => {
							e.target.src = `https://picsum.photos/seed/${item.id}y/600/400`;
						}}
					/>
					<button
						onClick={onClose}
						className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
					>
						<X size={15} />
					</button>
					<div
						className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}
					>
						<Icon size={12} /> {item.category}
					</div>
					{item.priority === "critical" && (
						<div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
							Critical
						</div>
					)}
				</div>

				<div className="p-6">
					<div className="flex items-start justify-between mb-3">
						<div className="flex-1 mr-3">
							<h2 className="text-lg font-bold text-gray-900 leading-tight">
								{item.label}
							</h2>
							<p className="text-xs text-gray-400 font-mono mt-0.5">
								{item.filename}
							</p>
						</div>
						<div className="text-right flex-shrink-0">
							<p className="text-2xl font-bold text-gray-900">
								{item.confidence}%
							</p>
							<p className="text-xs text-gray-400">
								AI Confidence
							</p>
						</div>
					</div>

					<div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
						<div
							className={`h-full rounded-full ${cfg.bar}`}
							style={{ width: `${item.confidence}%` }}
						/>
					</div>

					<p className="text-sm text-gray-600 leading-relaxed mb-5">
						{item.details}
					</p>

					<div className="grid grid-cols-2 gap-3">
						<div className="bg-gray-50 rounded-xl p-3">
							<p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 font-semibold">
								Location
							</p>
							<p className="text-sm font-bold text-gray-800">
								{item.location}
							</p>
						</div>
						<div className="bg-gray-50 rounded-xl p-3">
							<p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 font-semibold">
								Detected At
							</p>
							<p className="text-sm font-bold text-gray-800">
								{item.timestamp}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ImageClassificationPage() {
	const [stage, setStage] = useState("idle"); // 'idle' | 'analyzing' | 'results'
	const [uploadedFiles, setUploadedFiles] = useState([]);
	const [isDragging, setIsDragging] = useState(false);
	const [analyzeProgress, setAnalyzeProgress] = useState(0);
	const [analyzeStep, setAnalyzeStep] = useState(0);
	const [activeFilter, setActiveFilter] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedItem, setSelectedItem] = useState(null);
	const [results, setResults] = useState([]);
	const [totalUploaded, setTotalUploaded] = useState(0);
	const [apiError, setApiError] = useState(null);
	const [uploadError, setUploadError] = useState(null);

	const fileInputRef = useRef(null);
	const intervalRef = useRef(null);

	// ── File helpers ─────────────────────────────────────────────────────────────
	const addFiles = useCallback((fileList) => {
		const images = Array.from(fileList).filter((f) =>
			f.type.startsWith("image/"),
		);
		const entries = images.map((file) => ({
			id: Math.random().toString(36).slice(2),
			file,
			name: file.name,
			preview: URL.createObjectURL(file),
		}));
		setUploadedFiles((prev) => [...prev, ...entries]);
		setUploadError(null); // clear warning as soon as images are added
	}, []);

	const removeFile = (id) =>
		setUploadedFiles((prev) => {
			const toRemove = prev.find((f) => f.id === id);
			if (toRemove) URL.revokeObjectURL(toRemove.preview);
			return prev.filter((f) => f.id !== id);
		});

	// ── Drag & Drop ──────────────────────────────────────────────────────────────
	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragging(true);
	};
	const handleDragLeave = () => setIsDragging(false);
	const handleDrop = useCallback(
		(e) => {
			e.preventDefault();
			setIsDragging(false);
			addFiles(e.dataTransfer.files);
		},
		[addFiles],
	);

	// ── Progress animation ───────────────────────────────────────────────────────
	const startProgressAnimation = (cap = 85) => {
		let progress = 0;
		intervalRef.current = setInterval(() => {
			progress += Math.random() * 3.5 + 0.8;
			if (progress >= cap) {
				progress = cap;
				clearInterval(intervalRef.current);
			}
			setAnalyzeProgress(Math.round(progress));
			if (progress < 22) setAnalyzeStep(0);
			else if (progress < 50) setAnalyzeStep(1);
			else if (progress < 78) setAnalyzeStep(2);
			else setAnalyzeStep(3);
		}, 75);
	};

	const finishProgress = (newResults, newTotal) => {
		clearInterval(intervalRef.current);
		setAnalyzeProgress(100);
		setAnalyzeStep(4);
		setResults(newResults);
		setTotalUploaded(newTotal);
		setTimeout(() => setStage("results"), 700);
	};

	// ── Analysis ─────────────────────────────────────────────────────────────────
	const startAnalysis = async () => {
		// Guard: must have at least one image BEFORE changing any state
		if (uploadedFiles.length === 0) {
			setUploadError(
				"Please select at least one image before running the analysis.",
			);
			return;
		}

		setStage("analyzing");
		setAnalyzeProgress(0);
		setAnalyzeStep(0);
		setApiError(null);
		setUploadError(null);

		startProgressAnimation(85);

		try {
			const formData = new FormData();
			uploadedFiles.forEach((f) =>
				formData.append("images", f.file, f.name),
			);

			const response = await fetch(AI_API_URL, {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				const msg = data.details
					? `${data.error}: ${data.details}`
					: data.error || `Server error (${response.status})`;
				throw new Error(msg);
			}

			const fileMap = {};
			uploadedFiles.forEach((f) => {
				fileMap[f.name] = f;
			});

			const flagged = [];
			data.results.forEach((r) => {
				flagged.push(
					mapApiResult(
						r,
						fileMap[r.filename] ?? null,
						flagged.length,
					),
				);
			});

			finishProgress(flagged, data.total_processed);
		} catch (err) {
			clearInterval(intervalRef.current);
			setApiError(
				err.message ||
					"Could not reach the AI service. Make sure the server is running on port 3000.",
			);
			setAnalyzeProgress(0);
			setAnalyzeStep(0);
			setStage("idle");
		}
	};

	// ── Reset ────────────────────────────────────────────────────────────────────
	const resetPage = () => {
		clearInterval(intervalRef.current);
		uploadedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
		setStage("idle");
		setUploadedFiles([]);
		setAnalyzeProgress(0);
		setAnalyzeStep(0);
		setActiveFilter("All");
		setSearchQuery("");
		setSelectedItem(null);
		setResults([]);
		setTotalUploaded(0);
		setApiError(null);
		setUploadError(null);
	};

	// ── Derived ──────────────────────────────────────────────────────────────────
	const categoryCounts = results.reduce((acc, item) => {
		acc[item.category] = (acc[item.category] || 0) + 1;
		return acc;
	}, {});

	const filteredResults = results.filter((item) => {
		const matchCat =
			activeFilter === "All" || item.category === activeFilter;
		const q = searchQuery.toLowerCase();
		const matchSearch =
			!q ||
			item.label.toLowerCase().includes(q) ||
			item.location.toLowerCase().includes(q) ||
			item.filename.toLowerCase().includes(q);
		return matchCat && matchSearch;
	});



	// ── Render ───────────────────────────────────────────────────────────────────
	return (
		<section className="p-8">
			{/* Page Header */}
			<div className="mb-8 flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						Image Classification
					</h1>
					<p className="text-sm text-gray-500 mt-1">
						{stage === "idle" &&
							"Upload patrol images — AI will detect wildlife, traps, and other threats automatically."}
						{stage === "analyzing" &&
							"AI model is analyzing your uploaded images…"}
						{stage === "results" &&
							`Analyzed ${totalUploaded} image${totalUploaded !== 1 ? "s" : ""} — ${results.length} important finding${results.length !== 1 ? "s" : ""} flagged.`}
					</p>
				</div>
				{stage === "results" && (
					<button
						onClick={resetPage}
						className="flex items-center gap-2 text-sm font-medium text-gray-600
                       hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg
                       hover:bg-gray-50 transition-colors"
					>
						<RefreshCw size={14} /> New Batch
					</button>
				)}
			</div>

			{/* ══════════════════════ IDLE ══════════════════════════════════════════ */}
			{stage === "idle" && (
				<div>
					{/* API error banner */}
					{apiError && (
						<div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3.5 text-sm">
							<WifiOff
								size={16}
								className="flex-shrink-0 mt-0.5 text-red-500"
							/>
							<div className="flex-1">
								<p className="font-semibold text-red-800 mb-0.5">
									Classification Failed
								</p>
								<p className="text-red-600 leading-snug">
									{apiError}
								</p>
							</div>
							<button
								onClick={() => setApiError(null)}
								className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
							>
								<X size={14} />
							</button>
						</div>
					)}

					{/* Empty-selection alert */}
					{uploadError && (
						<div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
							<AlertCircle
								size={16}
								className="flex-shrink-0 text-amber-500"
							/>
							<p className="flex-1 font-medium">{uploadError}</p>
							<button
								onClick={() => setUploadError(null)}
								className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
							>
								<X size={14} />
							</button>
						</div>
					)}

					{/* Drop zone */}
					<div
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onClick={() => fileInputRef.current?.click()}
						className={`relative border-2 border-dashed rounded-2xl p-14 text-center
                        cursor-pointer transition-all duration-200 select-none
                        ${
							isDragging
								? "border-emerald-500 bg-emerald-50 scale-[1.01]"
								: "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
						}`}
					>
						<div className="flex flex-col items-center gap-3 pointer-events-none">
							<div
								className={`p-4 rounded-full transition-colors ${isDragging ? "bg-emerald-100" : "bg-white border border-gray-200 shadow-sm"}`}
							>
								<UploadCloud
									size={34}
									className={
										isDragging
											? "text-emerald-600"
											: "text-gray-400"
									}
								/>
							</div>
							<div>
								<p className="text-base font-semibold text-gray-700">
									{isDragging
										? "Release to add images"
										: "Drag & drop patrol images here"}
								</p>
								<p className="text-sm text-gray-400 mt-1">
									or click to browse — JPG, PNG, WEBP
									supported
								</p>
							</div>
							{uploadedFiles.length > 0 && (
								<span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
									{uploadedFiles.length} image
									{uploadedFiles.length !== 1 ? "s" : ""}{" "}
									selected
								</span>
							)}
						</div>
						<input
							ref={fileInputRef}
							type="file"
							multiple
							accept="image/*"
							className="hidden"
							onChange={(e) => {
								addFiles(e.target.files);
								e.target.value = "";
							}}
						/>
					</div>

					{/* Selected files preview */}
					{uploadedFiles.length > 0 && (
						<div className="mt-6">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-semibold text-gray-700">
									Selected Images&nbsp;
									<span className="text-gray-400 font-normal">
										({uploadedFiles.length})
									</span>
								</h3>
								<button
									onClick={() => {
										uploadedFiles.forEach((f) =>
											URL.revokeObjectURL(f.preview),
										);
										setUploadedFiles([]);
									}}
									className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
								>
									Remove all
								</button>
							</div>

							<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
								{uploadedFiles.map((f) => (
									<div
										key={f.id}
										className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
									>
										<img
											src={f.preview}
											alt={f.name}
											className="w-full h-full object-cover"
										/>
										<button
											onClick={(e) => {
												e.stopPropagation();
												removeFile(f.id);
											}}
											className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80
                                 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<X size={9} />
										</button>
										<div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
											{f.name}
										</div>
									</div>
								))}
							</div>

							{/* Analyze button */}
							<div className="mt-6 flex justify-end">
								<button
									onClick={startAnalysis}
									className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700
                             active:bg-emerald-800 text-white font-semibold
                             px-6 py-3 rounded-xl transition-colors shadow-sm text-sm"
								>
									<Zap size={16} />
									Analyze {uploadedFiles.length} Image
									{uploadedFiles.length !== 1 ? "s" : ""}
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ══════════════════════ ANALYZING ════════════════════════════════════ */}
			{stage === "analyzing" && (
				<div className="flex flex-col items-center justify-center py-20">
					<div className="relative mb-8">
						<div className="w-24 h-24 rounded-full border-[5px] border-emerald-100 border-t-emerald-500 animate-spin" />
						<div className="absolute inset-0 flex items-center justify-center">
							<ScanLine size={28} className="text-emerald-600" />
						</div>
					</div>

					<h2 className="text-xl font-bold text-gray-900 mb-1">
						Analyzing Images
					</h2>
					<p className="text-sm text-gray-500 mb-8">
						AI model is classifying your patrol images…
					</p>

					<div className="w-full max-w-md mb-7">
						<div className="flex justify-between text-xs text-gray-500 mb-2">
							<span className="font-medium">
								Overall Progress
							</span>
							<span className="font-bold text-gray-700 tabular-nums">
								{analyzeProgress}%
							</span>
						</div>
						<div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
							<div
								className="h-full bg-emerald-500 rounded-full transition-all duration-150"
								style={{ width: `${analyzeProgress}%` }}
							/>
						</div>
					</div>

					<div className="w-full max-w-md space-y-3">
						{ANALYSIS_STEPS.map((step, i) => {
							const isDone = i < analyzeStep;
							const isActive = i === analyzeStep;
							return (
								<div
									key={i}
									className={`flex items-center gap-3 text-sm transition-colors
                              ${isDone ? "text-emerald-600" : isActive ? "text-gray-900" : "text-gray-400"}`}
								>
									<div
										className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                                text-xs font-bold transition-all
                                ${
									isDone
										? "bg-emerald-500 text-white"
										: isActive
											? "bg-white border-2 border-emerald-500 text-emerald-600"
											: "bg-gray-100 text-gray-400"
								}`}
									>
										{isDone ? (
											<CheckCircle2 size={13} />
										) : (
											i + 1
										)}
									</div>
									<span
										className={
											isActive ? "font-semibold" : ""
										}
									>
										{step}
									</span>
									{isActive && (
										<span className="text-xs text-emerald-500 animate-pulse ml-auto">
											in progress…
										</span>
									)}
									{isDone && (
										<span className="text-xs text-emerald-400 ml-auto">
											done
										</span>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* ══════════════════════ RESULTS ══════════════════════════════════════ */}
			{stage === "results" && (
				<div>
					{/* Summary stat cards */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						{[
							{
								label: "Images Analyzed",
								value: totalUploaded,
								icon: Camera,
								textColor: "text-gray-800",
								iconBg: "bg-gray-100",
								iconColor: "text-gray-500",
							},
							{
								label: "Important Found",
								value: results.filter((r) => r.category !== "Forest").length,
								icon: CheckCircle2,
								textColor: "text-emerald-700",
								iconBg: "bg-emerald-100",
								iconColor: "text-emerald-600",
							},
							{
								label: "Wildlife Detected",
								value: categoryCounts["Wildlife"] || 0,
								icon: TreePine,
								textColor: "text-emerald-700",
								iconBg: "bg-emerald-50",
								iconColor: "text-emerald-500",
							},
							{
								label: "Threats Detected",
								value:
									(categoryCounts["Trap"] || 0) +
									(categoryCounts["Suspicious"] || 0),
								icon: AlertTriangle,
								textColor: "text-red-700",
								iconBg: "bg-red-50",
								iconColor: "text-red-500",
							},
						].map((s, i) => {
							const Icon = s.icon;
							return (
								<div
									key={i}
									className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3"
								>
									<div
										className={`p-2.5 rounded-lg flex-shrink-0 ${s.iconBg}`}
									>
										<Icon
											size={18}
											className={s.iconColor}
										/>
									</div>
									<div>
										<p
											className={`text-2xl font-bold ${s.textColor}`}
										>
											{s.value}
										</p>
										<p className="text-xs text-gray-500 font-medium leading-tight">
											{s.label}
										</p>
									</div>
								</div>
							);
						})}
					</div>

					{/* Filter bar */}
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2 flex-wrap">
							{["All", "Wildlife", "Trap", "Forest", "Suspicious"].map(
								(cat) => {
									const count =
										cat === "All"
											? results.length
											: categoryCounts[cat] || 0;
									const isActive = activeFilter === cat;
									const cfg =
										cat !== "All"
											? CATEGORY_CONFIG[cat]
											: null;
									return (
										<button
											key={cat}
											onClick={() => setActiveFilter(cat)}
											className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
                                ${
									isActive
										? cfg
											? cfg.tabActive
											: "bg-gray-900 text-white border-gray-900"
										: "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
								}`}
										>
											{cat}
											<span className="ml-1.5 opacity-60">
												({count})
											</span>
										</button>
									);
								},
							)}
						</div>

						<div className="hidden md:block h-5 w-px bg-gray-200" />

						<div className="flex items-center gap-2 flex-1 min-w-44">
							<Search
								size={14}
								className="text-gray-400 flex-shrink-0"
							/>
							<input
								type="text"
								placeholder="Search by label, file, or location…"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full text-sm outline-none text-gray-700 placeholder-gray-400"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery("")}
									className="text-gray-400 hover:text-gray-600 flex-shrink-0"
								>
									<X size={13} />
								</button>
							)}
						</div>
					</div>

					{/* Results grid */}
					{filteredResults.length === 0 ? (
						<div className="text-center py-20 text-gray-400">
							<ImageIcon
								size={42}
								className="mx-auto mb-3 text-gray-200"
							/>
							<p className="font-semibold text-gray-500">
								No results match your filter.
							</p>
							<p className="text-sm mt-1">
								Try selecting a different category or clearing
								the search.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
							{filteredResults.map((item) => (
								<ImageCard
									key={item.id}
									item={item}
									onView={setSelectedItem}
								/>
							))}
						</div>
					)}


				</div>
			)}

			{/* Detail Modal */}
			{selectedItem && (
				<DetailModal
					item={selectedItem}
					onClose={() => setSelectedItem(null)}
				/>
			)}
		</section>
	);
}
