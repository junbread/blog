---
title: "이펙티브 자바 3장 정리"
date: 2021-03-23
slug: "/effective-java-03"
tags: ["Study", "Java"]
---

## 아이템 10: equals는 일반 규약을 지켜 재정의하라

### equals는 언제 재정의해야 할까?

클래스가 다음과 같은 상황에 있다면 재정의하지 않는 것이 좋다.

- 각 인스턴스가 본질적으로 고유하다
- 인스턴스의 논리적 동치성을 검사할 일이 없다
- 상위 클래스에서 재정의한 equals가 하위 클래스에도 들어맞는다
- 클래스가 private이거나 package-private이고 equals 메서드를 호출할 일이 없다

### equals가 만족시켜야 하는 조건

equals는 다음 다섯 가지 조건을 만족해야 한다.

- 반사성: `A.equals(A)가 참이다`
- 대칭성: `A.equals(B)가 참이라면 B.equals(A)이다`

    ```java
    public class Point {
    	@Override boolean equals(Object o) {
    		if (!(o instanceof Point))
    			return false;

    		return ((Point) o).xxx == xxx;
    	}
    }

    public class ColorPoint {
    	@Override boolean equals(Object o) {
    		if (!(o instanceof ColorPoint))
    			return false;

    		return ((ColorPoint) o).xxx == xxx && ((ColorPoint) o).yyy == yyy;
    	}
    }
    ```

- 추이성: `A.equals(B)이고 B.equals(C)이면 A.equals(C)이다`
    - **구체 클래스를 확장하면서 동치 관계를 만족시킬 방법은 없다.**

        → 상속 대신 컴포지션을 사용하자.

- 일관성: `A.equals(B)의 결과는 언제나 같아야 한다`
    - equals의 판단에 신뢰할 수 없는 자원이 끼어들어서는 안 된다.
    equals에 네트워크를 통한 검사 로직이 들어 있다면?
- (null-아님): `모든 객체는 null과 같지 않다`

### 일반적인 equals 구현 방법

- `==` 연산자로 자기 자신의 참조인지 확인
- `instanceof`로 입력이 올바른 타입인지 확인
- 올바른 타입으로 캐스팅
- 핵심 필드들이 일치하는지 하나하나 검사
    - 비교 비용이 **낮은 필드**부터 비교하기

> `요약` 꼭 필요한 경우가 아니면 equals를 재정의하지 않는 것이 좋다. equals 재정의를 할 때에는 반사성, 대칭성, 추이성, 일관성, (null-아님)의 다섯 가지 규칙을 반드시 지켜야 한다.

## 아이템 11: equals를 재정의하려거든 hashCode도 재정의하라

hashCode를 재정의하지 않을 경우 애플리케이션 동작에 이상을 일으킬 수 있다.

### hashCode에 관한 규약

- equals 비교에 사용되는 정보가 변경되지 않았다면, 애플리케이션이 실행되는 동안 그 객체의 hashCode 메서드는 몇 번을 호출해도 일관되게 항상 같은 값을 반환해야 한다. 단, 애플리케이션을 다시 실행한다면 이 값이 달라져도 상관없다.
- equals 메서드가 같다고 판정한 두 객체의 hashCode 값은 같아야 한다.
- equals 메서드가 다르다고 판단한 두 객체의 hashCode 값이 꼭 다를 필요는 없다.

    → 그러나 서로 다른 hashCode 값이 나오면 해시 테이블의 성능이 향상될 수 있다.

### hashCode 구현시 주의사항

- 해시코드 계산에 핵심 필드가 빠지게 되면 해시 함수의 성능이 크게 감소할 수 있다.

Lombok의 `@EqualsAndHashCode` 를 이용하면 일관적으로 equals와 hashCode 메서드를 재정의할 수 있다.

> `요약` equals 재정의 시에는 hashCode를 항상 함께 재정의해야 한다.

## 아이템 12: toString을 항상 제공하라

toString은 직접 사용하지 않더라도 디버거, 객체 직렬화 등 많은 곳에서 사용되므로 재정의하는 것이 좋다.

### 좋은 toString 만들기

- toString에는 가급적 클래스의 핵심 정보를 모두 제공해야 한다.
- 주석으로 의도를 명확하게 밝히는 것이 좋다.
- toString이 반환한 값에 포함된 정보를 얻어올 수 있는 API를 제공해야 한다.

    → 그렇지 않으면 사실상 toString이 접근자 역할을 하게 되고, toString을 파싱하는 시도를 하게 된다.

역시 Lombok의 `@ToString`을 이용하면 간편하게 toString을 재정의할 수 있다.

> `요약` toString을 잘 구현한 클래스는 사용하기에 훨씬 즐겁고, 그 클래스를 사용한 시스템은 디버깅하기 쉽다.

## 아이템 13: clone 재정의는 주의해서 진행하라

### clone의 명세는 허술하다

- `Cloneable`은 아무런 메서드를 가지지 않는 인터페이스이지만, clone의 동작 방식을 결정한다.
- `Object.clone()`은 checked exception을 던지기 때문에 사용하기 불편하다.
- clone 메서드를 제대로 구현했는지 시스템적으로 검증할 방법이 없다.
    - `super.clone()`을 호출했는지, 생성자를 호출했는지 컴파일러는 상관하지 않는다.

### `clone` 재정의 시 주의사항

- clone 메소드는 사실상 생성자와 같은 효과를 낸다. 즉 clone은 원본 객체에 아무런 해를 끼치지 않는 동시에 복제된 객체의 불변식을 보장해야 한다.
    - 클래스가 가변 객체를 참조한다면 원본과 복제본이 가변 객체를 공유해도 되는지 확인하고, 깊은 복사를 구현해야 한다.
- 클래스가 Thread-safe하다면 clone 재정의 시에도 동기화에 신경써야 한다.
- Cloneable을 구현하는 클래스는 clone을 재정의해야 한다. 이 때 접근제어자를 public으로 바꾸고, 반환 타입을 클래스 자신으로 바꾸고, throws 절도 없애는 것이 좋다.
- 상속용 클래스는 Cloneable을 구현하게 하면 안 된다. 하위 클래스에서 clone을 지원할지 선택하게 하자.

### 복사 생성자와 복사 팩터리

자기 자신을 인수로 받는 생성자나, 유사한 방식의 정적 팩토리 메서드를 사용하면 clone의 단점이었던 허술한 스펙, final용법과 충돌, 불필요한 checked exception, 형변환 등을 해결할 수 있다.

```jsx
public Point(Point point) { ... }
public static Point newInstance(Point point) { ... }
```

> `요약` Cloneable 인터페이스와 clone은 허술하게 설계되어 있기 때문에 많은 문제를 내포하고 있다. 가급적 복사 생성자 방식을 사용하자.

## 아이템 14: Comparable을 구현할지 고려하라

### compareTo의 특징과 규칙

- compareTo 메소드는 Object가 아닌 Comparable 인터페이스에 있다.
- compareTo 는 제네릭이고, 순서뿐 아니라 동치성도 비교할 수 있다.
- compareTo 메소드의 일반 규칙과 주의사항은 equals 규칙과 비슷하다.
    - 반사성, 대칭성, 추이성을 충족해야 한다.
    - (권장) compareTo를 이용한 동치성 테스트는 equals 결과와 같아야 한다.
    - 구체 클래스를 확장한 경우 compareTo의 규칙을 지킬 수 없으며, 컴포지션으로 우회한다.

### compareTo 메서드 구현 시의 주의사항

- 기본 타입 클래스를 비교할 때도 가급적 박싱된 기본 타입 클래스에 추가된 compare 메서드를 이용하자.
- 값의 차를 기준으로 compareTo를 구현하는 경우 오버플로우, 부동소수점 오류 등 예상치 않은 결과를 낼 수 있다.

Comparable을 구현하지 않은 클래스를 비교하거나, 표준이 아닌 순서로 비교하고 싶은 경우 Comparator를 사용한다.

> `요약` 순서를 고려할 수 있는 값 객체를 만드는 경우 Comparable을 구현하면 컬렉션의 강력한 여러 기능들을 이용할 수 있게 된다.