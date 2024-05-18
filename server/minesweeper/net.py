import pytorch_lightning as pl
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchmetrics.functional as FM

from .game import Game


class ResidualBlock(nn.Module):

    def __init__(self, channels: int):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, 1, 1)
        self.norm1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, 3, 1, 1)
        # self.norm2 = nn.BatchNorm2d(channels)

    def forward(self, x):
        shortcut = x
        x = self.conv1(x)
        x = F.relu(x)
        x = self.norm1(x)
        x = self.conv2(x)
        x = shortcut + x
        return x


class Net(pl.LightningModule):

    def __init__(self, channels: int = 128, blocks: int = 10):
        super().__init__()
        self.head = nn.Conv2d(Game.NUM_CLASSES, channels, 3, 1, 1)

        def block():
            return ResidualBlock(channels)

        self.body = nn.Sequential(*[block() for _ in range(blocks)])
        self.tail = nn.Conv2d(channels, 3, 3, 1, 1)

    def forward(self, x):
        x = self.head(x)
        x = self.body(x)
        x = self.tail(x)
        return x

    def training_step(self, batch, batch_idx):
        inputs, target = batch
        pred = self(inputs)
        loss = F.cross_entropy(pred, target)
        self.log('loss', loss)
        return loss

    def test_step(self, batch, batch_idx):
        inputs, target = batch
        target = target.to(torch.int64)
        pred = self(inputs)
        roc_auc = FM.auroc(pred, target, task='binary')
        self.log('roc_auc', roc_auc)

    def validation_step(self, batch, batch_idx):
        inputs, target = batch
        target = target.to(torch.int64)
        pred = self(inputs)
        roc_auc = FM.auroc(pred, target, task='binary')
        self.log('roc_auc', roc_auc)

    def configure_optimizers(self):
        optimizer = torch.optim.Adam(self.parameters())
        return optimizer
