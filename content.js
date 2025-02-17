function extractProductInfo() {
    // 상품명 추출
    const title = document.querySelector('.prod-buy-header__title')?.textContent?.trim();
    
    // 가격 추출 (원 제거)
    const price = document.querySelector('.total-price')?.textContent?.trim()
      .replace('원', '').replace(/,/g, '');
    
    // 이미지 URL 추출 (최대 4개)
    const imageUrls = [];
    document.querySelectorAll('.prod-image__item img').forEach((img, index) => {
      if (index < 4 && img.src) {
        // // 로 시작하는 URL을 https://로 변환
        const imgUrl = img.src.replace(/^\/\//, 'https://');
        imageUrls.push(imgUrl);
      }
    });
  
    // 데이터를 JSON으로 변환
    const productData = {
      title,
      price,
      imageUrls
    };
  
    return productData;
  }
  
  // 플로팅 버튼 생성
  function createFloatingButton() {
    const button = document.createElement('button');
    button.id = 'copyProductInfo';
    button.className = 'floating-button';
    button.textContent = '상품 정보 복사';
    
    button.addEventListener('click', async () => {
      try {
        const productInfo = extractProductInfo();
        await navigator.clipboard.writeText(JSON.stringify(productInfo));
        
        // 성공 메시지 표시
        button.textContent = '복사 완료!';
        button.classList.add('success');
        
        setTimeout(() => {
          button.textContent = '상품 정보 복사';
          button.classList.remove('success');
        }, 2000);
      } catch (error) {
        console.error('Error copying product info:', error);
        
        // 에러 메시지 표시
        button.textContent = '복사 실패';
        button.classList.add('error');
        
        setTimeout(() => {
          button.textContent = '상품 정보 복사';
          button.classList.remove('error');
        }, 2000);
      }
    });
  
    document.body.appendChild(button);
  }
  
  // 페이지 로드 시 플로팅 버튼 생성
  createFloatingButton();
  