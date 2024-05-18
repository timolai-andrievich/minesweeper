import argparse

from flask import Flask, request, abort, send_from_directory
from flask_cors import CORS, cross_origin
import waitress
import torch
import torch.nn.functional as F

import minesweeper
from minesweeper import Net


class ModelWrapper:

    def __init__(self, saved_path: str):
        saved = torch.load(saved_path)
        model_kwargs = saved['model_kwargs']
        state_dict = saved['state_dict']
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.device = 'cpu'
        self.model = Net(**model_kwargs).to(self.device)
        self.model.load_state_dict(state_dict)

    def least_likely_cell(self):
        if not request.is_json:
            abort(400)
        data = request.get_json()
        board = [[0 for _ in range(data['width'])]
                 for _ in range(data['height'])]
        for row in range(data['height']):
            for col in range(data['width']):
                if not data['board'][row][col]['isRevealed']:
                    board[row][col] = minesweeper.Game.HIDDEN_CELL
                else:
                    board[row][col] = data['board'][row][col]['adjacentMines']
        inputs = torch.tensor(board).to(self.device)
        mask = torch.where(inputs == minesweeper.Game.HIDDEN_CELL, 1, 0)
        inputs = F.one_hot(inputs, num_classes=minesweeper.Game.NUM_CLASSES)
        inputs = inputs.to(torch.float)
        inputs = inputs.transpose(0, 2)
        inputs = inputs.transpose(1, 2)
        inputs = inputs.unsqueeze(0)
        with torch.no_grad():
            pred = self.model(inputs)[0]
        probs = F.softmax(pred, dim=0)[1]
        probs *= mask
        vals, row = probs.max(dim=0)
        col = vals.argmax(dim=0)
        row = row[col]
        col = col.item()
        row = row.item()
        return [row, col]


class Args:
    static_path: str
    model_path: str
    port: int


def parse_args() -> Args:
    parser = argparse.ArgumentParser()
    parser.add_argument('--static-path', type=str, required=True)
    parser.add_argument('--model-path', type=str, required=True)
    parser.add_argument('--port', type=int, default=80)
    args = parser.parse_args()
    return args


def main():
    args = parse_args()
    model = ModelWrapper(args.model_path)
    app = Flask(__name__)
    CORS(app)

    @app.route("/")
    def svelte_base():
        return send_from_directory(args.static_path, "index.html")

    @app.route("/<path:path>")
    def svelte_path(path):
        return send_from_directory(args.static_path, path)

    @app.route("/leastLikelyCell", methods=["POST"])
    @cross_origin()
    def least_likely_cell(*args, **kwargs):
        return model.least_likely_cell(*args, **kwargs)

    app.run(port=args.port)
    # waitress.serve(app, port=args.port)


if __name__ == "__main__":
    main()
