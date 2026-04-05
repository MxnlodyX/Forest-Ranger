// src/server.js
import express from "express";
import cors from "cors";
import * as tf from "@tensorflow/tfjs";
import multer from "multer";
import { Jimp } from "jimp";
import path from "path";

const app = express();
const port = 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Serve model files over HTTP so tf.loadLayersModel can fetch them
const modelDir = path.join(process.cwd(), "Teachable_Embedding_Model");
app.use("/model_files", express.static(modelDir));

let model;
let tfReady = false;

async function initTF() {
	// Force the pure-JS CPU backend — WebGL is not available in Node.js
	await tf.setBackend("cpu");
	await tf.ready();
	tfReady = true;
	console.log(`✅ TensorFlow.js backend: ${tf.getBackend()}`);
}

async function loadModel() {
	try {
		await initTF();
		const modelUrl = `http://localhost:${port}/model_files/model.json`;
		console.log(`⏳ Loading model from: ${modelUrl}`);
		model = await tf.loadLayersModel(modelUrl);
		// Warm-up: run one dummy prediction so the first real call is fast
		const dummy = tf.zeros([1, 224, 224, 3]);
		const warmup = model.predict(dummy);
		warmup.dispose();
		dummy.dispose();
		console.log("✅ Model loaded and warmed up successfully!");
	} catch (err) {
		console.error("❌ Model load error:", err.message);
	}
}

app.post("/predict", upload.array("images"), async (req, res) => {
	if (!req.files || req.files.length === 0) {
		return res
			.status(400)
			.json({ error: "No images uploaded. Please send image files." });
	}

	if (!tfReady) {
		return res
			.status(503)
			.json({ error: "TensorFlow backend is still initializing. Please retry." });
	}

	if (!model) {
		return res
			.status(503)
			.json({ error: "Model is still loading. Please retry in a moment." });
	}

	try {
		const classNames = ["Forest", "Trap", "Wildlife"];
		const allResults = [];

		for (const file of req.files) {
			// ── 1. Decode & resize ────────────────────────────────────────────
			const image = await Jimp.read(file.buffer);
			image.resize({ w: 224, h: 224 });

			const { data, width, height } = image.bitmap;

			// ── 2. Build normalised Float32 tensor  [-1, 1] ───────────────────
			const float32Data = new Float32Array(width * height * 3);
			for (let i = 0; i < width * height; i++) {
				float32Data[i * 3 + 0] = data[i * 4 + 0] / 127.5 - 1; // R
				float32Data[i * 3 + 1] = data[i * 4 + 1] / 127.5 - 1; // G
				float32Data[i * 3 + 2] = data[i * 4 + 2] / 127.5 - 1; // B
			}

			// ── 3. Predict (model.predict is synchronous on the CPU backend) ──
			const baseTensor = tf.tensor3d(float32Data, [height, width, 3]);
			const inputTensor = baseTensor.expandDims(0); // shape [1, 224, 224, 3]

			const prediction = model.predict(inputTensor); // ← no await here
			const predictionArray = Array.from(await prediction.data());

			// ── 4. Argmax ─────────────────────────────────────────────────────
			let maxIndex = 0;
			let maxConfidence = predictionArray[0];
			for (let i = 1; i < predictionArray.length; i++) {
				if (predictionArray[i] > maxConfidence) {
					maxConfidence = predictionArray[i];
					maxIndex = i;
				}
			}

			const confidencePct = maxConfidence * 100;
			const low_confidence = confidencePct < 75;

			// ── 5. Log result ─────────────────────────────────────────────────
			console.log(`\n┌─ 📷  ${file.originalname}`);
			classNames.forEach((name, i) => {
				const pct = (predictionArray[i] * 100).toFixed(2).padStart(6);
				const bar = "█".repeat(Math.round(predictionArray[i] * 20));
				const marker = i === maxIndex ? " ◄" : "";
				console.log(`│   ${name.padEnd(10)} ${pct}%  ${bar}${marker}`);
			});
			console.log(
				`└─ Result: ${classNames[maxIndex]} @ ${confidencePct.toFixed(2)}%` +
					(low_confidence ? "  ⚠️  LOW CONFIDENCE" : "")
			);

			allResults.push({
				filename: file.originalname,
				result: classNames[maxIndex],
				confidence: (maxConfidence * 100).toFixed(2) + "%",
				low_confidence,
				raw_prediction: predictionArray,
			});

			// ── 6. Free GPU/CPU memory ────────────────────────────────────────
			baseTensor.dispose();
			inputTensor.dispose();
			prediction.dispose();
		}

		res.json({
			success: true,
			total_processed: allResults.length,
			results: allResults,
		});
	} catch (error) {
		console.error("❌ Prediction error:", error);
		// Surface the real error message so the frontend can display it
		res.status(500).json({
			error: "Failed to process images",
			details: error.message ?? String(error),
		});
	}
});

app.listen(port, () => {
	console.log(`🚀 Server running at http://localhost:${port}`);
	loadModel();
});
