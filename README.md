# Minesweeper

A simple app for playing minesweeper with AI-powered hints.

## How to run

Ensure that `docker` is installed, then simply run

```bash
docker compose up
```

## How to re-train the ML model

In the `/backend/` directory, run `python train.py` with required parameters, for example:

```bash
python train.py\
  --epochs 20\
  --blocks 10\
  --channels 128\
  --width 10\
  --height 10\
  --mines 10\
  --batch-size 64\
  --output-file model.ckpt
```

## How does it work?

The ML model is a convolutional neural network with residual connections. Each block consists of two convolutions with one batch normalization. The output of the model is a tensor of probabilities for each cell (mine/not mine). For hints, the cell with the least probability of being a mine is selected.

During training, random minesweeper games are generated (empty cell is revealed at each move), and the model is trained on a sample of generated positions.

