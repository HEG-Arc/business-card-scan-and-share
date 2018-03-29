import numpy as np
import cv2
a = cv2.equalizeHist(cv2.imread('Card_imgs/6.jpg', cv2.IMREAD_GRAYSCALE))
b = cv2.equalizeHist(cv2.imread('Card_imgs/7.jpg', cv2.IMREAD_GRAYSCALE))
c = cv2.equalizeHist(cv2.imread('Card_imgs/8.jpg', cv2.IMREAD_GRAYSCALE))
d = cv2.equalizeHist(cv2.imread('Card_imgs/9.jpg', cv2.IMREAD_GRAYSCALE))

e = cv2.equalizeHist(cv2.imread('Card_imgs/5.jpg', cv2.IMREAD_GRAYSCALE))

def delta(a, b):
    #diff_img = cv2.absdiff(a, b)
    #rank_diff = int(np.sum(diff_img)/255)
    rank_diff =cv2.matchTemplate(a, b, cv2.TM_CCOEFF_NORMED)
    print(rank_diff)

delta(a, a)
delta(a, b)
delta(a, c)
delta(a, d)
delta(b, b)
delta(b, c)
delta(b, d)
delta(c, d)

delta(e, a)
delta(e, b)
delta(e, c)
delta(e, d)
