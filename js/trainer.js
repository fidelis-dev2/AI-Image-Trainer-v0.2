let featureExtractor = null;
let classifierModel = null;
let trainingData = [];
let featureExtractorReady = false;
const DEFAULT_CLASS_NAMES = window.APP_SEED.classes;
const MODEL_STORAGE_KEY = 'localstorage://poultryvision-ai-classifier';

function getClassNames() {
  const settings = readJSON(STORAGE_KEYS.settings, {});
  const names = (settings.classes || DEFAULT_CLASS_NAMES)
    .map(v => String(v || '').trim())
    .filter(Boolean);
  return names.length ? names : DEFAULT_CLASS_NAMES;
}

function persistModelSettings(extra = {}) {
  const current = readJSON(STORAGE_KEYS.settings, {
    appName: window.APP_SEED.appName,
    classes: DEFAULT_CLASS_NAMES
  });
  writeJSON(STORAGE_KEYS.settings, { ...current, ...extra });
}

function updateTrainButtons() {
  const prepareBtn = document.getElementById('prepareBtn');
  const trainBtn = document.getElementById('trainBtn');
  if (prepareBtn) prepareBtn.disabled = !featureExtractorReady;
  if (trainBtn && !trainingData.length) trainBtn.disabled = true;
}

async function ensureFeatureExtractor() {
  if (featureExtractor && featureExtractorReady) return featureExtractor;
  const status = document.getElementById('status');
  try {
    if (status) status.textContent = 'Loading MobileNet...';
    featureExtractor = await mobilenet.load({ version: 2, alpha: 1.0 });
    if (!featureExtractor || typeof featureExtractor.infer !== 'function') {
      throw new Error('Feature extractor haijapakiwa vizuri.');
    }
    featureExtractorReady = true;
    if (status) status.textContent = 'MobileNet ready';
    logLine('MobileNet loaded successfully. Ready to prepare dataset.');
    updateTrainButtons();
    return featureExtractor;
  } catch (error) {
    featureExtractorReady = false;
    if (status) status.textContent = 'Feature extractor failed';
    throw error;
  }
}

async function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Imeshindikana kusoma picha: ${file.name}`));
    img.src = URL.createObjectURL(file);
  });
}

function logLine(text) {
  const log = document.getElementById('log');
  if (!log) return;
  log.textContent += `${text}\n`;
  log.scrollTop = log.scrollHeight;
}

function sanitizeImageTensor(imgEl) {
  return tf.tidy(() => tf.browser
    .fromPixels(imgEl)
    .resizeBilinear([224, 224], true)
    .toFloat()
    .div(255)
    .expandDims(0));
}

async function extractEmbedding(imgEl) {
  await ensureFeatureExtractor();
  return tf.tidy(() => {
    const tensor = sanitizeImageTensor(imgEl);
    const embedding = featureExtractor.infer(tensor, true);
    return embedding.flatten().clone();
  });
}

function createClassifier(numClasses, featureSize) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [featureSize], units: 256, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.25 }));
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.15 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  model.compile({
    optimizer: tf.train.adam(0.0005),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  return model;
}

function previewTemplate(className, idx) {
  return `
    <div class="col-lg-6">
      <div class="feature-box h-100">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div>
            <div class="fw-bold">${className}</div>
            <small class="text-muted">Pakia picha za aina hii. Mfumo unakubali image/* yoyote inayofunguka kwenye browser.</small>
          </div>
          <span class="badge rounded-pill text-bg-light border" id="count-${idx}">0 images</span>
        </div>
        <input class="form-control classInput mb-3" type="file" accept="image/*" multiple data-label="${idx}">
        <div class="upload-grid" id="gallery-${idx}">
          <div class="empty-gallery">Preview za picha zitaonekana hapa chini.</div>
        </div>
      </div>
    </div>`;
}

function renderPreviews(input, files, classNames) {
  const idx = Number(input.dataset.label);
  const gallery = document.getElementById(`gallery-${idx}`);
  const count = document.getElementById(`count-${idx}`);
  if (!gallery || !count) return;

  if (!files.length) {
    gallery.innerHTML = '<div class="empty-gallery">Hakuna picha zilizochaguliwa bado.</div>';
    count.textContent = '0 images';
    return;
  }

  gallery.innerHTML = files.map(file => {
    const url = URL.createObjectURL(file);
    return `
      <div class="upload-thumb">
        <img src="${url}" alt="${file.name}">
        <div class="upload-meta">
          <div class="upload-name" title="${file.name}">${file.name}</div>
          <small>${classNames[idx]} • ${(file.size / 1024).toFixed(1)} KB</small>
        </div>
      </div>`;
  }).join('');
  count.textContent = `${files.length} image${files.length > 1 ? 's' : ''}`;
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrapData();
  const user = requireAuth(['admin', 'analyst']);
  if (!user) return;
  renderShell('train');

  const classNames = getClassNames();

  document.getElementById('pageContent').innerHTML = `
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-transparent border-0 pt-4 px-4">
        <h5 class="mb-1">Train AI model</h5>
        <p class="text-muted mb-0">Pakia picha kwa kila class, zi-preview chini, andaa dataset, train model, kisha save kwenye browser au download files.</p>
      </div>
      <div class="card-body px-4 pb-4">
        <div class="row g-3 mb-4">
          ${classNames.map((className, idx) => previewTemplate(className, idx)).join('')}
        </div>

        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <label class="form-label">Epochs</label>
            <input id="epochs" type="number" class="form-control" min="1" max="100" value="12">
          </div>
          <div class="col-md-4">
            <label class="form-label">Batch size</label>
            <input id="batchSize" type="number" class="form-control" min="1" max="128" value="8">
          </div>
          <div class="col-md-4">
            <label class="form-label">Validation split</label>
            <input id="validationSplit" type="number" step="0.05" min="0.05" max="0.5" class="form-control" value="0.2">
          </div>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-4">
          <button class="btn btn-primary rounded-pill" id="prepareBtn" disabled>Prepare Dataset</button>
          <button class="btn btn-success rounded-pill" id="trainBtn" disabled>Start Training</button>
          <button class="btn btn-outline-primary rounded-pill" id="saveBrowserBtn" disabled>Save to Browser</button>
          <button class="btn btn-outline-success rounded-pill" id="downloadBtn" disabled>Download Model</button>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-md-4"><div class="mini-panel"><div class="text-muted small">Samples</div><h4 id="sampleCount">0</h4></div></div>
          <div class="col-md-4"><div class="mini-panel"><div class="text-muted small">Feature Size</div><h4 id="featureSizeView">-</h4></div></div>
          <div class="col-md-4"><div class="mini-panel"><div class="text-muted small">Status</div><h4 id="status">Loading MobileNet...</h4></div></div>
        </div>

        <div class="progress mb-3"><div class="progress-bar" id="progressBar" style="width:0%">0%</div></div>
        <pre class="log-box" id="log"></pre>
      </div>
    </div>`;

  document.querySelectorAll('.classInput').forEach(input => {
    input.addEventListener('change', () => renderPreviews(input, [...input.files], classNames));
  });

  ensureFeatureExtractor().catch(error => {
    console.error(error);
    Swal.fire({ icon: 'error', title: 'Model load failed', text: error.message });
  });

  document.getElementById('prepareBtn').onclick = async () => {
    try {
      await ensureFeatureExtractor();

      trainingData.forEach(item => item.xs?.dispose?.());
      trainingData = [];
      document.getElementById('log').textContent = '';
      document.getElementById('progressBar').style.width = '0%';
      document.getElementById('progressBar').textContent = '0%';
      logLine('Preparing dataset...');

      const inputs = [...document.querySelectorAll('.classInput')];
      let total = 0;
      let featureSize = null;
      const usedClasses = new Set();

      for (const input of inputs) {
        const labelIndex = Number(input.dataset.label);
        const files = [...input.files].filter(file => file.type.startsWith('image/'));
        if (files.length) usedClasses.add(labelIndex);

        for (const file of files) {
          const img = await fileToImage(file);
          const embedding = await extractEmbedding(img);
          const currentSize = embedding.shape[0];
          if (!featureSize) featureSize = currentSize;
          if (featureSize !== currentSize) {
            embedding.dispose();
            throw new Error(`Feature size ya ${file.name} haitoi ukubwa unaofanana. Tarajia ${featureSize}, imeleta ${currentSize}.`);
          }
          trainingData.push({ xs: embedding, ys: labelIndex, name: file.name });
          total += 1;
          logLine(`Added ${file.name} -> ${classNames[labelIndex]} [${currentSize}]`);
        }
      }

      if (!trainingData.length) {
        return Swal.fire({ icon: 'warning', title: 'No images', text: 'Weka angalau picha moja kwenye class yoyote.' });
      }

      if (usedClasses.size < 2) {
        return Swal.fire({ icon: 'warning', title: 'Classes hazijatosha', text: 'Kwa training bora weka picha angalau kwenye class mbili tofauti.' });
      }

      document.getElementById('sampleCount').textContent = total;
      document.getElementById('status').textContent = 'Dataset prepared';
      document.getElementById('featureSizeView').textContent = featureSize || '-';
      document.getElementById('trainBtn').disabled = false;
      persistModelSettings({ classes: classNames, featureSize: featureSize || null });
      Swal.fire({ icon: 'success', title: 'Dataset ready', text: `Samples ${total} zimeandaliwa vizuri.` });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Preparation failed', text: err.message });
    }
  };

  document.getElementById('trainBtn').onclick = async () => {
    let xTrain = null;
    let yTrain = null;
    try {
      if (!trainingData.length) throw new Error('Andaa dataset kwanza kabla ya ku-train.');

      const featureSize = trainingData[0].xs.shape[0];
      classifierModel = createClassifier(classNames.length, featureSize);
      xTrain = tf.stack(trainingData.map(d => d.xs));
      yTrain = tf.oneHot(tf.tensor1d(trainingData.map(d => d.ys), 'int32'), classNames.length);
      const epochs = Number(document.getElementById('epochs').value);
      const batchSize = Number(document.getElementById('batchSize').value);
      const validationSplit = Number(document.getElementById('validationSplit').value);
      document.getElementById('status').textContent = 'Training in progress';

      const history = await classifierModel.fit(xTrain, yTrain, {
        epochs,
        batchSize,
        validationSplit,
        shuffle: true,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            const pct = Math.round(((epoch + 1) / epochs) * 100);
            const bar = document.getElementById('progressBar');
            bar.style.width = `${pct}%`;
            bar.textContent = `${pct}%`;
            const acc = Number(logs.acc ?? logs.accuracy ?? 0);
            const valAcc = Number(logs.val_acc ?? logs.val_accuracy ?? 0);
            logLine(`Epoch ${epoch + 1}/${epochs} - acc: ${acc.toFixed(4)} - val_acc: ${valAcc.toFixed(4)}`);
          }
        }
      });

      const accHist = history.history.val_accuracy || history.history.accuracy || [];
      const finalAccuracy = accHist[accHist.length - 1] || 0;
      const runs = getTrainingRuns();
      runs.unshift({ date: nowString(), epochs, samples: trainingData.length, accuracy: finalAccuracy, by: user.fullName });
      saveTrainingRuns(runs);

      persistModelSettings({ classes: classNames, featureSize });
      document.getElementById('status').textContent = 'Training completed';
      document.getElementById('saveBrowserBtn').disabled = false;
      document.getElementById('downloadBtn').disabled = false;
      Swal.fire({ icon: 'success', title: 'Training complete', text: `Final accuracy: ${(finalAccuracy * 100).toFixed(2)}%` });
    } catch (err) {
      console.error(err);
      document.getElementById('status').textContent = 'Training failed';
      Swal.fire({ icon: 'error', title: 'Training failed', text: err.message });
    } finally {
      xTrain?.dispose?.();
      yTrain?.dispose?.();
    }
  };

  document.getElementById('saveBrowserBtn').onclick = async () => {
    if (!classifierModel) return;
    await classifierModel.save(MODEL_STORAGE_KEY);
    Swal.fire({ icon: 'success', title: 'Saved', text: 'Model imehifadhiwa kwenye browser.' });
  };

  document.getElementById('downloadBtn').onclick = async () => {
    if (!classifierModel) return;
    await classifierModel.save('downloads://poultryvision-ai-classifier');
    Swal.fire({ icon: 'success', title: 'Downloaded', text: 'Model files zimedownloadiwa.' });
  };
});
