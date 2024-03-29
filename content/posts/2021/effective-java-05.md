---
title: "이펙티브 자바 5장 정리"
date: 2021-04-12
tags: ["Study", "Java"]
---

제네릭은 취급할 수 있는 타입을 컴파일러에게 알려줌으로써, 컴파일 타임에 올바른 타입을 사용했는지 검사할 수 있게 해 더 안전하고 명확한 프로그램을 만들 수 있게 한다.

## 아이템 26: 로 타입은 사용하지 말라

로 타입이란 제네릭에서 **타입 매개변수를 전혀 사용하지 않은 경우**를 말한다.

→ 컴파일 타임 오류 검사를 사용할 수 없기 때문에 제네릭의 안전성과 표현력을 전혀 활용할 수 없다.

```java
public class Raw {
    public static void main(String[] args) {
        List<String> strings = new ArrayList<>();
        unsafeAdd(strings, Integer.valueOf(42));
        String s = strings.get(0); // 컴파일러가 자동으로 형변환 코드를 넣어준다.
    }

    private static void unsafeAdd(List list, Object o) {
        list.add(o);
    }
}
```

### `List`, `List<Object>`의 차이

- `List`는 제네릭과 무관하다.
- `List<Object>`는 모든 타입을 허용한다고 명시적으로 컴파일러에게 정보를 전달해주는 것이다.

### 원소의 타입을 모른 채 사용하고 싶다면?

- 비한정적 와일드카드 타입을 사용하자. `List<?>`
    - 이 경우 리스트에 아무 원소도 넣을 수 없게 된다.
    - 이런 제약을 받아들일 수 없다면 제네릭 메서드, 한정적 와일드카드 타입을 이용하자.
- 단, 클래스 리터럴을 사용하거나, instanceof 연산자 사용시에는 로 타입을 사용해야 한다. (실체화 불가능)

## 아이템 27: 비검사 경고를 제거하라

비검사 경고는 중요하니 무시하지 말자. 잠재적 ClassCastException 오류를 일으킬 수 있다.

- 경고를 제거할 수 없지만 타입이 안전하다고 확신할 수 있다면  `@SuppressWarnings("unchecked")` 어노테이션을 붙여 경고를 숨기자.
    - 가능한 좁은 범위에 적용해야 한다. (오류 가능성을 줄이기 위해)
    - 경고를 무시해도 안전한 이유를 주석으로 같이 남겨두도록 하자.

## 아이템 28: 배열보다는 리스트를 사용하라

### **배열 vs 제네릭**

- 배열은 공변(covariant)이다.
    - `Sub` 클래스가 `Super` 라는 클래스의 하위 타입이라면, 배열 `Sub[]`은 배열 `Super[]`의 하위 타입이 된다.
- 제네릭은 불공변(invariant)이다.
    - 서로 다른 Type1과 Type2가 있을 때, `List<Type1>`은 `List<Type2>`의 상위 타입도 하위 타입도 아니다.

```java
Object[] objectArray = new Long[1];
ObjectArray[0] = "타입이 달라 넣을 수 없다."; // ArrayStoreException을 던진다.

List<Object> ol = new ArrayList<Long>(); // 호환되지 않는 타입이다.
ol.add("타입이 달라 넣을 수 없다.");
```

배열에서는 위와 같은 실수를 런타임에야 알 수 있지만, 리스트는 코드를 실행하기 전에 알 수 있다.

- 배열은 실체화된다.
    - 런타임에도 원소의 타입을 인지하고 확인한다.
- 제네릭은 런타임 시에 타입이 소거된다.
    - 제네릭 지원 전의 레거시 코드와 함께 사용하기 위함

### **제네릭 배열을 생성할 수 없는 이유**

제네릭 배열은 타입 안전하지 않다.

```java
List<String>[] stringLists = new List<String>[1];   // (1)
List<Integer> intList = List.of(42);                // (2)
Object[] objects = stringLists;                     // (3)
objects[0] = intList;                               // (4)
String s = stringLists[0].get(0);                   // (5)
```

- (2)는 원소가 하나인 리스트를 생성했다.
- (3)은 (1)을 Object 배열에 할당한다. 배열은 공변이니 아무 문제없다.
- (4)는 (2)에서 생성한 인스턴스를 Object 배열의 첫 번째 원소로 저장한다.
    - 제네릭은 소거 방식으로 구현되어서 성공한다.
- (5) (1)에서 `List<String>`만 담겠다고 했으나, 배열에는 현재 `List<Integer>`가 담겨있다.
    - 첫 번째 원소를 꺼내어 String으로 형변환할 때 `ClassCastException`가 발생한다.

`E`, `List<E>`, `List<String>`과 같은 타입을 **실체화 불가 타입(non-reifiable type)** 이라고 한다.

- 제네릭의 소거 특성으로 인해 실체화되지 않아 런타임 시에 컴파일 타임보다 타입 정보를 적게 갖는다.

제네릭과 배열은 궁합이 맞지 않기 때문에, 가급적 함께 사용하지 않고 대신 리스트를 사용하는 것이 좋다.

## 아이템 29: 이왕이면 제네릭 타입으로 만들라

클라이언트에서 직접 형변환해야 하는 타입보다 제네릭 타입이 더 안전하고 사용하기에도 편리하다.

### 기존 클래스를 제네릭 타입으로 변경하는 방법

```java
// Object 기반으로 구현된 스택
public class Stack {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(Object e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public Object pop() {
        if (size == 0) {
            throw new EmptyStackException();
        }

        Object result = elements[--size];
        elements[size] = null;
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }
}

```

```java
// E[]를 이용한 제네릭 스택 (170-174쪽)
public class Stack<E> {
    private E[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    // 코드 29-3 배열을 사용한 코드를 제네릭으로 만드는 방법 1 (172쪽)
    // 배열 elements는 push(E)로 넘어온 E 인스턴스만 담는다.
    // 따라서 타입 안전성을 보장하지만,
    // 이 배열의 런타임 타입은 E[]가 아닌 Object[]다!
    @SuppressWarnings("unchecked")
    public Stack() {
        elements = (E[]) new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public E pop() {
        if (size == 0)
            throw new EmptyStackException();
        E result = elements[--size];
        elements[size] = null; // 다 쓴 참조 해제
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }

    // 코드 29-5 제네릭 Stack을 사용하는 맛보기 프로그램 (174쪽)
    public static void main(String[] args) {
        Stack<String> stack = new Stack<>();
        for (String arg : args)
            stack.push(arg);
        while (!stack.isEmpty())
            System.out.println(stack.pop().toUpperCase());
    }
}
```

```java
// Object[]를 이용한 제네릭 Stack (170-174쪽)
public class Stack<E> {
    private Object[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;
    
    public Stack() {
        elements = new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    // 코드 29-4 배열을 사용한 코드를 제네릭으로 만드는 방법 2 (173쪽)
    // 비검사 경고를 적절히 숨긴다.
    public E pop() {
        if (size == 0)
            throw new EmptyStackException();

        // push에서 E 타입만 허용하므로 이 형변환은 안전하다.
        @SuppressWarnings("unchecked") E result =
                (E) elements[--size];

        elements[size] = null; // 다 쓴 참조 해제
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }

    // 코드 29-5 제네릭 Stack을 사용하는 맛보기 프로그램 (174쪽)
    public static void main(String[] args) {
        Stack<String> stack = new Stack<>();
        for (String arg : args)
            stack.push(arg);
        while (!stack.isEmpty())
            System.out.println(stack.pop().toUpperCase());
    }
```

- 제네릭 타입은 타입 매개변수에 대부분의 제약을 두지 않지만 기본 타입은 사용할 수 없다.

    → 박싱된 기본 타입을 통해 우회할 수 있다.

- 타입 매개변수에 제약을 두는 한정적 타입 매개변수

```java
// java.util.concurrent.DelayQueue
class DelayQueue<E extends Delayed> implements BlockingQueue<E>
```

- `<E extends Delayed>`는 Delayed의 하위 타입만 받겠다는 뜻이 된다.
    - DelayQueue 자신과 이를 사용하는 클라이언트는 DelayQueue의 원소에서 형변환 없이 곧바로 Delayed 클래스의 메서드를 호출할 수 있다.

## 아이템 30: 이왕이면 제네릭 메서드로 만들라

메서드도 제네릭으로 만들 수 있다.

```java
public static Set union(Set s1, Set s2) {
    Set result = new HashSet(s1);
    result.addAll(s2);
    return result;
}
```

```java
// 코드 30-2 제네릭 메서드 (177쪽)
public static <E> Set<E> union(Set<E> s1, Set<E> s2) {
    Set<E> result = new HashSet<>(s1);
    result.addAll(s2);
    return result;
}
```

### **제네릭 싱글톤 팩터리**

- 제네릭은 런타임에 타입 정보가 소거되기 때문에 하나의 객체를 어떤 타입으로든 매개변수화할 수 있다.
- 요청한 타입 매개변수에 맞도록 매번 그 객체의 타입을 변경해주는 정적 팩터리를 만들어야 한다. ex) `Collections.emptySet()`

### **재귀적 타입 한정**

- 자기 자신이 들어간 표현식을 사용하여 타입 매개변수의 허용 범위를 한정
    - 주로 타입의 순서를 정하는 Comparable 인터페이스와 함께 쓰인다.
    - `<E extends Comparable<E>>`는 “모든 타입 E는 자신과 비교할 수 있다” 라고 읽을 수 있다.

```java
// 코드 30-7 컬렉션에서 최댓값을 반환한다. - 재귀적 타입 한정 사용 (179쪽)
public static <E extends Comparable<E>> E max(Collection<E> c) {
    if (c.isEmpty())
        throw new IllegalArgumentException("컬렉션이 비어 있습니다.");

    E result = null;
    for (E e : c)
        if (result == null || e.compareTo(result) > 0)
            result = Objects.requireNonNull(e);

    return result;
}
```

## 아이템 31: 한정적 와일드카드를 사용해 API 유연성을 높이라

- 매개변수화 타입은 불공변(invariant)이다.
    - `List<Object>`를 파라미터로 받는 메서드의 인자로 `List<String>`을 전달할 수 없다.
- 제네릭을 좀 더 유연하게 사용할 수는 없을까?

    → 입력 파라미터에 와일드카드 타입을 사용하자.

한정적 와일드카드를 사용할 때는 **PECS**를 기억하자.

- Producer - Extend: 메서드의 매개변수가 생산자의 역할을 한다면 extend를 사용
- Consumer - Super: 메서드의 매개변수가 소비자의 역할을 한다면 super를 사용

```java
// 와일드카드 타입을 이용해 대량 작업을 수행하는 메서드를 포함한 제네릭 스택 (181-183쪽)
public class Stack<E> {
    private E[] elements;
    private int size = 0;
    private static final int DEFAULT_INITIAL_CAPACITY = 16;

    // 코드 29-3 배열을 사용한 코드를 제네릭으로 만드는 방법 1 (172쪽)
    // 배열 elements는 push(E)로 넘어온 E 인스턴스만 담는다.
    // 따라서 타입 안전성을 보장하지만,
    // 이 배열의 런타임 타입은 E[]가 아닌 Object[]다!
    @SuppressWarnings("unchecked") 
    public Stack() {
        elements = (E[]) new Object[DEFAULT_INITIAL_CAPACITY];
    }

    public void push(E e) {
        ensureCapacity();
        elements[size++] = e;
    }

    public E pop() {
        if (size==0)
            throw new EmptyStackException();
        E result = elements[--size];
        elements[size] = null; // 다 쓴 참조 해제
        return result;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    private void ensureCapacity() {
        if (elements.length == size)
            elements = Arrays.copyOf(elements, 2 * size + 1);
    }

//    // 코드 31-1 와일드카드 타입을 사용하지 않은 pushAll 메서드 - 결함이 있다! (181쪽)
//    public void pushAll(Iterable<E> src) {
//        for (E e : src)
//            push(e);
//    }

     // 코드 31-2 E 생산자(producer) 매개변수에 와일드카드 타입 적용 (182쪽)
    public void pushAll(Iterable<? extends E> src) {
        for (E e : src)
            push(e);
    }

//    // 코드 31-3 와일드카드 타입을 사용하지 않은 popAll 메서드 - 결함이 있다! (183쪽)
//    public void popAll(Collection<E> dst) {
//        while (!isEmpty())
//            dst.add(pop());
//    }

    // 코드 31-4 E 소비자(consumer) 매개변수에 와일드카드 타입 적용 (183쪽)
    public void popAll(Collection<? super E> dst) {
        while (!isEmpty())
            dst.add(pop());
    }

    // 제네릭 Stack을 사용하는 맛보기 프로그램
    public static void main(String[] args) {
        Stack<Number> numberStack = new Stack<>();
        Iterable<Integer> integers = Arrays.asList(3, 1, 4, 1, 5, 9);
        numberStack.pushAll(integers);

        Collection<Object> objects = new ArrayList<>();
        numberStack.popAll(objects);

        System.out.println(objects);
    }
}
```

### 주의사항

- 메서드의 리턴값으로 와일드카드를 사용하는 것은 피해야 한다.
    - 클라이언트에서도 와일드카드 자료형을 사용해야 하기 때문

```java
class swapTest {
    // 방법1) 비한정적 타입 매개변수
    public static <E> void typeArgSwap(List<E> list, int i, int j) {
        list.set(i, list.set(j, list.get(i)));
    }

    // 방법2) 비한정적 와일드카드
    public static void wildcardSwap(List<?> list, int i, int j) {
        wildcardSwapHelper(list, i, j);
    }

    // 방법2-1) 와일드카드 형에는 null외에 어떤 값도 넣을 수 없다.
    // 방법1과 메서드 시그니처(이름과 파라미터)가 동일하다.
    private static <E> void wildcardSwapHelper(List<E> list, int i, int j) {
        list.set(i, list.set(j, list.get(i)));
    }
}
```

## 아이템 32: 제네릭과 가변인수를 함께 쓸 때는 신중하라

가변인수 메서드를 호출하면 가변인수를 담기 위한 배열이 자동으로 생긴다.

→ 제네릭 타입 가변인수 배열에 값을 저장하게 되면 타입 안정성이 깨진다.

```java
// 코드 32-1 제네릭과 varargs를 혼용하면 타입 안전성이 깨진다! (191-192쪽)
static void dangerous(List<String>... stringLists) {
    List<Integer> intList = List.of(42);
    Object[] objects = stringLists;
    objects[0] = intList; // 힙 오염 발생
    String s = stringLists[0].get(0); // ClassCastException
}

public static void main(String[] args) {
    dangerous(List.of("There be dragons!"));
}
```

- 컴파일 오류는 발생하지 않지만, 인수를 건네 호출하게 되면 `ClassCastException`이 발생한다.
- 해당 코드 부분에 컴파일러가 생성한 형변환 코드가 숨어 있기 때문이다.

### 제네릭 가변인수 배열을 안전하게 사용하는 방법

varargs 매개변수 배열이 순수하게 인수들을 전달한다면 그 메서드는 안전하다.

- 메서드가 가변인수 메서드가 호출될 때 생성되는 varargs 매개변수 배열에 아무것도 저장하지 않아야 한다.
- 배열의 참조가 신뢰할 수 없는 곳에 노출되지 않아야 한다.
- (메서드를 재정의할 수 없어야 한다.)

## 아이템 33: 타입 안전 이종 컨테이너를 고려하라

제네릭에서 매개변수화되는 대상은 원소가 아닌 컨테이너 자신이다. 따라서 하나의 컨테이너에서 매개변수화할 수 있는 타입의 수가 제한된다.

좀 더 유연한 구현을 위해서 타입 안전 이종 컨테이너 패턴을 사용할 수 있다.

- 타입 안전 이종 컨테이너 패턴: 컨테이너 대신 키를 매개변수화한 다음에 컨테이너에 값을 넣거나 뺄 때 매개변수화한 키를 함께 제공한다.

    → 컴파일타임 타입 정보와 런타임 타입 정보를 알아내기 위해 메서드들이 주고받는 class 리터럴을 타입 토큰이라고 한다.

```java
// 타입 안전 이종 컨테이너 패턴 (199-202쪽)
public class Favorites {
    // 코드 33-3 타입 안전 이종 컨테이너 패턴 - 구현 (200쪽)
    private Map<Class<?>, Object> favorites = new HashMap<>();

    public <T> void putFavorite(Class<T> type, T instance) {
        favorites.put(Objects.requireNonNull(type), instance);
    }

    public <T> T getFavorite(Class<T> type) {
        return type.cast(favorites.get(type));
    }

//    // 코드 33-4 동적 형변환으로 런타임 타입 안전성 확보 (202쪽)
//    public <T> void putFavorite(Class<T> type, T instance) {
//        favorites.put(Objects.requireNonNull(type), type.cast(instance));
//    }

    // 코드 33-2 타입 안전 이종 컨테이너 패턴 - 클라이언트 (199쪽)
    public static void main(String[] args) {
        Favorites f = new Favorites();
        
        f.putFavorite(String.class, "Java");
        f.putFavorite(Integer.class, 0xcafebabe);
        f.putFavorite(Class.class, Favorites.class);
       
        String favoriteString = f.getFavorite(String.class);
        int favoriteInteger = f.getFavorite(Integer.class);
        Class<?> favoriteClass = f.getFavorite(Class.class);
        
        System.out.printf("%s %x %s%n", favoriteString,
                favoriteInteger, favoriteClass.getName());
    }
}
```

### 주의사항

- 타입 토큰을 로 타입으로 넘길 경우 타입 안정성이 깨진다.

    → 동적 형변환으로 런타임 타입 안정성을 확보할 수 있다.

```java
f.putFavorite((Class)Integer.class, "Integer의 인스턴스가 아닙니다.");
int favoriteInteger = f.getFavorite(Integer.class);
```

- 실체화가 불가능한 타입은 넣을 수 없다.
    - `String`이나 `String[]`은 저장할 수 있지만, `List<String>`은 저장할 수 없다.
    - 우회하기 위한 방법으로는 슈퍼 타입 토큰을 사용할 수 있다.

```java
List<String> pets = Arrays.asList("강아지", "고양이");
f.putFavorite(new TypeRef<List<String>>(){}, pets);
List<String> list = f.getFavorite(new TypeRef<List<String>>(){});
```

### 슈퍼 타입 토큰

한마디로 요약하면, 런타임에 어떻게든 파라미터 타입에 대한 정보가 남아있도록 구현하는 것