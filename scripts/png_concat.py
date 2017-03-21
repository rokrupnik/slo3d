from PIL import Image
import time
import sys

start = time.time()

if (len(sys.argv) < 6):
    print('Usage: python png_concat.py z x0 x1 y0 y1')
    exit()

z = int(sys.argv[1])
x0 = int(sys.argv[2])
x1 = int(sys.argv[3])
y0 = int(sys.argv[4])
y1 = int(sys.argv[5])

sizes = [0, 2, 4, 8, 16, 32, 63, 125, 250, 500, 1000]

image_size = sizes[z]

x_range = (x1 - x0) + 1
y_range = (y1 - y0) + 1

blank_image = Image.new("RGB", (image_size * x_range, image_size * y_range))

for (x, x_image) in zip(range(x0, x1 + 1), range(0, image_size * x_range, image_size)):
    for (y, y_image) in zip(range(y0, y1 + 1), range(image_size * (y_range - 1), -1, -image_size)):
        image = Image.open('../data/%s/%s_%s.png' % (z, x, y))

        blank_image.paste(image, (x_image, y_image))

blank_image.save('../data/%s/%s_%s-%sx%s.png' % (z, x0, y0, x_range, y_range))

end = time.time()
print(end - start)
