import torch
import torch.utils.data as utils

from .game import Game


def generate_game(width: int = 10,
                  height: int = 10,
                  mines: int = 10) -> tuple[list, list]:
    assert mines <= width * height
    positions = []
    targets = []
    game = Game(width=width, height=height, mines=mines)
    while not game.finished:
        positions.append(game.get_bitboard())
        targets.append(game.get_target())
        game.random_move()
    targets.append(game.get_target())
    positions.append(game.get_bitboard())
    return positions, targets


class GameDataset(utils.Dataset):

    def __init__(self,
                 length: int,
                 width: int = 10,
                 height: int = 10,
                 mines: int = 10):
        self.length = length
        self.width = width
        self.height = height
        self.mines = mines

    def __len__(self):
        return self.length

    def __getitem__(self, idx):
        game = generate_game(width=self.width,
                             height=self.height,
                             mines=self.mines)
        return game


def collate_games(batch):
    positions = []
    targets = []
    for p, t in batch:
        positions.extend(p)
        targets.extend(t)
    return torch.stack(positions), torch.stack(targets)
