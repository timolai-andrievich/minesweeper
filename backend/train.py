import argparse
import sys

import torch
import torch.utils.data as utils
import pytorch_lightning as pl

import minesweeper


class Args:
    epochs: int
    blocks: int
    channels: int
    width: int
    height: int
    mines: int
    batch_size: int
    output_file: str


def parse_args() -> Args:
    parser = argparse.ArgumentParser()
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--blocks', type=int, default=10)
    parser.add_argument('--channels', type=int, default=128)
    parser.add_argument('--width', type=int, default=10)
    parser.add_argument('--height', type=int, default=10)
    parser.add_argument('--mines', type=int, default=10)
    parser.add_argument('--batch-size', type=int, default=16)
    parser.add_argument('--output-file', type=str, default='model.ckpt')
    args = parser.parse_args()
    return args


def main():
    sys.setrecursionlimit(100_000)
    args = parse_args()
    dataset = minesweeper.GameDataset(128, args.width, args.height, args.mines)
    loader = utils.DataLoader(
        dataset,
        batch_size=args.batch_size,
        collate_fn=minesweeper.collate_games,
        num_workers=7,
    )

    model_kwargs = {
        'channels': args.channels,
        'blocks': args.blocks,
    }
    model = minesweeper.Net(**model_kwargs)
    checkpoint_callback = pl.callbacks.ModelCheckpoint(monitor='roc_auc',
                                                       mode='max',
                                                       save_last=True)
    trainer = pl.Trainer(max_epochs=args.epochs,
                         callbacks=[checkpoint_callback])
    trainer.fit(model, loader, loader)
    best_model = minesweeper.Net.load_from_checkpoint(
        checkpoint_callback.best_model_path,
        **model_kwargs,
    )
    torch.save(
        {
            'state_dict': best_model.state_dict(),
            'model_kwargs': model_kwargs,
        },
        args.output_file,
    )


if __name__ == "__main__":
    main()
