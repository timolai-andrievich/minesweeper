import argparse

from fastapi import FastAPI
from pydantic import BaseModel
import torch
import torch.nn.functional as F
import uvicorn

import minesweeper
from minesweeper import Net


class BoardCell(BaseModel):
    adjacentMines: int
    isRevealed: bool


class BoardData(BaseModel):
    width: int
    height: int
    board: list[list[BoardCell]]


class ModelWrapper:

    def __init__(self, saved_path: str):
        self.device = 'cpu'
        saved = torch.load(saved_path, map_location=self.device)
        model_kwargs = saved['model_kwargs']
        state_dict = saved['state_dict']
        self.model = Net(**model_kwargs, ).to(self.device)
        self.model.load_state_dict(state_dict)

    def least_likely_cell(self, data: BoardData):
        data = data.model_dump(mode='json')
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
    model_path: str
    host: str
    port: int


def parse_args() -> Args:
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-path', type=str, required=True)
    parser.add_argument('--port', type=int, default=80)
    parser.add_argument('--host', type=str, default="0.0.0.0")
    args = parser.parse_args()
    return args


def main() -> None:
    args = parse_args()
    model = ModelWrapper(args.model_path)
    app = FastAPI()

    @app.post("/api/leastLikelyCell")
    def least_likely_cell(data: BoardData):
        return model.least_likely_cell(data)

    @app.get('/health')
    def health():
        return {}

    uvicorn.run(app, port=args.port, host=args.host)


if __name__ == '__main__':
    main()
