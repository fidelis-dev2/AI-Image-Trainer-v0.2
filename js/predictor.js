let predictorFeatureExtractor = null;
let predictorModel = null;
let predictorReady = false;
const MODEL_STORAGE_KEY = 'localstorage://poultryvision-ai-classifier';

function getPredictClasses() {
  const settings = readJSON(STORAGE_KEYS.settings, {});
  return (settings.classes || window.APP_SEED.classes || []).filter(Boolean);
}

async function ensurePredictorFeatureExtractor() {
  if (predictorFeatureExtractor && predictorReady) return predictorFeatureExtractor;
  predictorFeatureExtractor = await mobilenet.load({ version: 2, alpha: 1.0 });
  if (!predictorFeatureExtractor || typeof predictorFeatureExtractor.infer !== 'function') {
    throw new Error('MobileNet feature extractor haijapakiwa vizuri.');
  }
  predictorReady = true;
  return predictorFeatureExtractor;
}

async function loadClassifier() {
  predictorModel = await tf.loadLayersModel(MODEL_STORAGE_KEY);
  return predictorModel;
}

function getModelFeatureSize() {
  if (!predictorModel) return null;
  const shape = predictorModel.inputs?.[0]?.shape || [];
  return Number(shape[shape.length - 1]) || null;
}

async function preprocessForPredict(imgEl) {
  await ensurePredictorFeatureExtractor();
  return tf.tidy(() => {
    const tensor = tf.browser
      .fromPixels(imgEl)
      .resizeBilinear([224, 224], true)
      .toFloat()
      .div(255)
      .expandDims(0);

    const features = predictorFeatureExtractor.infer(tensor, true).flatten();
    const expectedSize = getModelFeatureSize();
    const actualSize = features.shape[0];

    if (expectedSize && expectedSize !== actualSize) {
      throw new Error(`Feature mismatch. Model inatarajia ${expectedSize} lakini MobileNet imetoa ${actualSize}. Train na save model upya kwenye toleo hili.`);
    }

    return features.expandDims(0).clone();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrapData();
  const user = requireAuth();
  if (!user) return;
  renderShell('predict');

  const predClasses = getPredictClasses();

  document.getElementById('pageContent').innerHTML = `
    <div class="row g-4">
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pt-4 px-4">
            <h5 class="mb-1">Run prediction</h5>
            <p class="text-muted mb-0">Load saved model, upload image ya aina yoyote inayokubaliwa na browser, kisha predict.</p>
          </div>
          <div class="card-body px-4 pb-4">
            <div class="d-flex flex-wrap gap-2 mb-3">
              <button class="btn btn-primary rounded-pill" id="loadModelBtn">Load Browser Model</button>
              <input type="file" class="form-control" id="imageInput" accept="image/*">
              <button class="btn btn-success rounded-pill" id="predictBtn" disabled>Predict Now</button>
            </div>
            <div class="alert alert-info border-0 rounded-4 mb-3" id="predictStatus">Loading MobileNet...</div>
            <div class="preview-box mb-3" id="previewBox">Image preview will appear here.</div>
            <div class="result-card" id="resultBox">
              <h6 class="mb-2">Result</h6>
              <div class="text-muted">No prediction yet.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent border-0 pt-4 px-4">
            <h5 class="mb-1">Model notes</h5>
            <p class="text-muted mb-0">Class labels zinatokana na training ya mwisho uliyofanya na ku-save kwenye browser.</p>
          </div>
          <div class="card-body px-4 pb-4">
            <ul class="list-group list-group-flush">
              <li class="list-group-item px-0">Classes: ${predClasses.join(', ')}</li>
              <li class="list-group-item px-0">Feature extractor: MobileNet</li>
              <li class="list-group-item px-0">Storage: Browser localStorage</li>
              <li class="list-group-item px-0">Permissions: Viewer anaweza kupredict lakini si kutrain.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>`;

  const imageInput = document.getElementById('imageInput');
  const previewBox = document.getElementById('previewBox');
  const predictBtn = document.getElementById('predictBtn');
  const statusBox = document.getElementById('predictStatus');
  let previewImg = null;

  function refreshPredictButton() {
    predictBtn.disabled = !(predictorReady && predictorModel && previewImg);
  }

  ensurePredictorFeatureExtractor()
    .then(() => {
      statusBox.className = 'alert alert-success border-0 rounded-4 mb-3';
      statusBox.textContent = 'MobileNet ready. Sasa load model na uchague picha.';
      refreshPredictButton();
    })
    .catch(error => {
      console.error(error);
      statusBox.className = 'alert alert-danger border-0 rounded-4 mb-3';
      statusBox.textContent = `MobileNet failed: ${error.message}`;
      Swal.fire({ icon: 'error', title: 'MobileNet failed', text: error.message });
    });

  document.getElementById('loadModelBtn').onclick = async () => {
    try {
      await ensurePredictorFeatureExtractor();
      await loadClassifier();
      const featureSize = getModelFeatureSize();
      statusBox.className = 'alert alert-success border-0 rounded-4 mb-3';
      statusBox.textContent = `Model loaded. Input feature size: ${featureSize || '-'}.`; 
      refreshPredictButton();
      Swal.fire({ icon: 'success', title: 'Model loaded', text: 'Browser model imefunguliwa vizuri.' });
    } catch (e) {
      console.error(e);
      statusBox.className = 'alert alert-danger border-0 rounded-4 mb-3';
      statusBox.textContent = 'Hakuna model iliyopatikana. Train na save kwanza.';
      Swal.fire({ icon: 'error', title: 'Model not found', text: 'Hakuna model kwenye browser. Train na save kwanza.' });
    }
  };

  imageInput.onchange = () => {
    const file = imageInput.files[0];
    if (!file) {
      previewImg = null;
      previewBox.textContent = 'Image preview will appear here.';
      refreshPredictButton();
      return;
    }
    const url = URL.createObjectURL(file);
    previewBox.innerHTML = `<img src="${url}" class="img-fluid rounded-4 preview-image" alt="preview">`;
    previewImg = previewBox.querySelector('img');
    refreshPredictButton();
  };

  document.getElementById('predictBtn').onclick = async () => {
    let features = null;
    let prediction = null;
    try {
      const predClassesLive = getPredictClasses();
      if (!previewImg) {
        return Swal.fire({ icon: 'warning', title: 'Missing image', text: 'Chagua image kwanza.' });
      }
      if (!predictorModel) {
        return Swal.fire({ icon: 'warning', title: 'Model not loaded', text: 'Load browser model kwanza.' });
      }
      await ensurePredictorFeatureExtractor();
      features = await preprocessForPredict(previewImg);
      prediction = predictorModel.predict(features);
      const values = Array.from(await prediction.data());
      const maxIndex = values.indexOf(Math.max(...values));
      const label = predClassesLive[maxIndex] || `Class ${maxIndex + 1}`;
      const confidence = values[maxIndex] || 0;
      document.getElementById('resultBox').innerHTML = `
        <h6 class="mb-2">Result</h6>
        <div class="display-6 fw-bold mb-2">${label}</div>
        <div class="text-muted mb-2">Confidence ${(confidence * 100).toFixed(2)}%</div>
        <div class="progress mb-3" role="progressbar"><div class="progress-bar" style="width:${confidence * 100}%"></div></div>
        <div class="small text-muted">Top probabilities: ${values.map((v, i) => `${predClassesLive[i] || `Class ${i + 1}`} ${(v * 100).toFixed(1)}%`).join(' • ')}</div>`;

      const predictions = getPredictions();
      predictions.unshift({ label, confidence, date: nowString(), by: user.fullName });
      savePredictions(predictions);
      Swal.fire({ icon: 'success', title: label, text: `Confidence ${(confidence * 100).toFixed(2)}%` });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Prediction failed', text: err.message });
    } finally {
      features?.dispose?.();
      prediction?.dispose?.();
    }
  };
});
