import time
import sys
from PIL import Image

START = time.time()

if (len(sys.argv) < 4):
    print('Usage: python png_concat.py z x y')
    exit()

SIZES = [0, 2, 4, 8, 16, 32, 63, 125, 250, 500, 1000]

def calculate_dim(level):
    """
        Level dimensions follow this rule:
        Level 10: 1
        Level 9: 2
        Level 8: 4 ...

        @param   {int} level
        @return  {int} dimension
    """
    dim = 1
    for i in range(10 - level):
        dim *= 2
    return dim

def concat_and_save(z, x0, x_range, y0, y_range):

    image_size = SIZES[z]

    x1 = (x0 + x_range) - 1
    y1 = (y0 + y_range) - 1

    blank_image = Image.new("RGB", (image_size * x_range, image_size * y_range))

    for (x, x_image) in zip(range(x0, x1 + 1), range(0, image_size * x_range, image_size)):
        for (y, y_image) in zip(range(y0, y1 + 1), range(image_size * (y_range - 1), -1, -image_size)):
            image = Image.open('../../data/%s/%s_%s.png' % (z, x, y))

            blank_image.paste(image, (x_image, y_image))

    blank_image.save('../data/%s/%s_%s.png' % (z, x0, y0))

def generate_tiles(level, x, y, dim):
    if (dim < 1 or level > 10):
        return

    if (level in [6, 7, 8, 9, 10]):
        concat_and_save(level, x, dim, y, dim)
    print(level, x, dim, y, dim)

    dim2 = int(dim / 2)
    level1 = level + 1
    generate_tiles(level1, x, y, dim2)
    generate_tiles(level1, x + dim2, y, dim2)
    generate_tiles(level1, x, y + dim2, dim2)
    generate_tiles(level1, x + dim2, y + dim2, dim2)

LEVEL_START = int(sys.argv[1])
X = int(sys.argv[2])
Y = int(sys.argv[3])

DIM_START = calculate_dim(LEVEL_START)

generate_tiles(LEVEL_START, X, Y, DIM_START)

END = time.time()
print(END - START)
